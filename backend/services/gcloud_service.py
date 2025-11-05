"""
Google Cloud Service - Real Cloud Run deployment
Handles Cloud Build, Artifact Registry, and Cloud Run operations
"""

import os
import json
import subprocess
from typing import Dict, List, Optional, Callable
from pathlib import Path
import asyncio


class GCloudService:
    """Production-grade Google Cloud Platform integration"""
    
    def __init__(self, project_id: Optional[str] = None, region: str = 'us-central1'):
        self.project_id = project_id or os.getenv('GOOGLE_CLOUD_PROJECT')
        self.region = region or os.getenv('GOOGLE_CLOUD_REGION', 'us-central1')
        self.artifact_registry = f'{self.region}-docker.pkg.dev'
        
        if not self.project_id:
            raise ValueError('GOOGLE_CLOUD_PROJECT environment variable required')
    
    def validate_gcloud_auth(self) -> Dict:
        """Verify gcloud CLI is authenticated"""
        try:
            result = subprocess.run(
                ['gcloud', 'auth', 'list', '--format=json'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                accounts = json.loads(result.stdout)
                active = [acc for acc in accounts if acc.get('status') == 'ACTIVE']
                
                if active:
                    return {
                        'authenticated': True,
                        'account': active[0].get('account'),
                        'project': self.project_id
                    }
            
            return {'authenticated': False, 'error': 'No active gcloud account'}
            
        except Exception as e:
            return {'authenticated': False, 'error': f'Auth check failed: {str(e)}'}
    
    async def build_image(
        self, 
        project_path: str, 
        image_name: str,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        """
        Build Docker image using Cloud Build
        
        Args:
            project_path: Local path to project with Dockerfile
            image_name: Name for the image (e.g., 'my-app')
            progress_callback: Optional async callback for progress updates
        """
        try:
            image_tag = f'{self.artifact_registry}/{self.project_id}/servergem/{image_name}:latest'
            
            if progress_callback:
                await progress_callback({
                    'stage': 'build',
                    'progress': 10,
                    'message': 'Starting Cloud Build...'
                })
            
            # Submit build to Cloud Build
            cmd = [
                'gcloud', 'builds', 'submit',
                '--project', self.project_id,
                '--region', self.region,
                '--tag', image_tag,
                project_path
            ]
            
            print(f"[GCloudService] Building image: {image_tag}")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Stream output
            progress = 10
            async for line in process.stdout:
                line_str = line.decode().strip()
                print(f"[CloudBuild] {line_str}")
                
                if progress_callback:
                    progress = min(progress + 5, 80)
                    await progress_callback({
                        'stage': 'build',
                        'progress': progress,
                        'message': line_str
                    })
            
            await process.wait()
            
            if process.returncode == 0:
                if progress_callback:
                    await progress_callback({
                        'stage': 'build',
                        'progress': 100,
                        'message': 'Build completed successfully'
                    })
                
                return {
                    'success': True,
                    'image_tag': image_tag,
                    'message': f'Image built: {image_tag}'
                }
            else:
                stderr = await process.stderr.read()
                raise Exception(f"Build failed: {stderr.decode()}")
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Build failed: {str(e)}'
            }
    
    async def deploy_to_cloudrun(
        self,
        image_tag: str,
        service_name: str,
        env_vars: Optional[Dict[str, str]] = None,
        secrets: Optional[Dict[str, str]] = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        """
        Deploy image to Cloud Run
        
        Args:
            image_tag: Full image tag from Artifact Registry
            service_name: Cloud Run service name
            env_vars: Environment variables dict
            secrets: Secrets to mount (name: secret_path)
            progress_callback: Optional async callback for progress updates
        """
        try:
            if progress_callback:
                await progress_callback({
                    'stage': 'deploy',
                    'progress': 10,
                    'message': f'Deploying {service_name} to Cloud Run...'
                })
            
            cmd = [
                'gcloud', 'run', 'deploy', service_name,
                '--image', image_tag,
                '--project', self.project_id,
                '--region', self.region,
                '--platform', 'managed',
                '--allow-unauthenticated',
                '--port', '8080',
                '--memory', '512Mi',
                '--cpu', '1',
                '--max-instances', '10',
                '--min-instances', '0',
                '--timeout', '300'
            ]
            
            # Add environment variables
            if env_vars:
                env_str = ','.join([f'{k}={v}' for k, v in env_vars.items()])
                cmd.extend(['--set-env-vars', env_str])
            
            # Add secrets
            if secrets:
                for secret_name, secret_version in secrets.items():
                    cmd.extend(['--set-secrets', f'{secret_name}={secret_version}'])
            
            print(f"[GCloudService] Deploying service: {service_name}")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Stream output
            progress = 10
            async for line in process.stdout:
                line_str = line.decode().strip()
                print(f"[CloudRun] {line_str}")
                
                if progress_callback:
                    progress = min(progress + 5, 90)
                    await progress_callback({
                        'stage': 'deploy',
                        'progress': progress,
                        'message': line_str
                    })
            
            await process.wait()
            
            if process.returncode == 0:
                # Get service URL
                service_url = await self._get_service_url(service_name)
                
                if progress_callback:
                    await progress_callback({
                        'stage': 'deploy',
                        'progress': 100,
                        'message': f'Deployment complete: {service_url}'
                    })
                
                return {
                    'success': True,
                    'service_name': service_name,
                    'url': service_url,
                    'region': self.region,
                    'message': f'Deployed successfully to {service_url}'
                }
            else:
                stderr = await process.stderr.read()
                raise Exception(f"Deployment failed: {stderr.decode()}")
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Deployment failed: {str(e)}'
            }
    
    async def _get_service_url(self, service_name: str) -> str:
        """Get Cloud Run service URL"""
        try:
            cmd = [
                'gcloud', 'run', 'services', 'describe', service_name,
                '--project', self.project_id,
                '--region', self.region,
                '--format', 'value(status.url)'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, _ = await process.communicate()
            
            if process.returncode == 0:
                return stdout.decode().strip()
            else:
                return f'https://{service_name}-{self.region}.run.app'
                
        except Exception:
            return f'https://{service_name}-{self.region}.run.app'
    
    async def create_secret(self, secret_name: str, secret_value: str) -> Dict:
        """Create or update a secret in Secret Manager"""
        try:
            # Check if secret exists
            check_cmd = [
                'gcloud', 'secrets', 'describe', secret_name,
                '--project', self.project_id
            ]
            
            check_process = await asyncio.create_subprocess_exec(
                *check_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await check_process.wait()
            
            if check_process.returncode == 0:
                # Secret exists, add new version
                cmd = [
                    'gcloud', 'secrets', 'versions', 'add', secret_name,
                    '--data-file=-',
                    '--project', self.project_id
                ]
            else:
                # Create new secret
                cmd = [
                    'gcloud', 'secrets', 'create', secret_name,
                    '--data-file=-',
                    '--project', self.project_id,
                    '--replication-policy', 'automatic'
                ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate(input=secret_value.encode())
            
            if process.returncode == 0:
                return {
                    'success': True,
                    'secret_name': secret_name,
                    'message': f'Secret {secret_name} created/updated'
                }
            else:
                raise Exception(stderr.decode())
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to create secret: {str(e)}'
            }
    
    def get_service_logs(self, service_name: str, limit: int = 50) -> List[str]:
        """Fetch recent logs from Cloud Run service"""
        try:
            cmd = [
                'gcloud', 'logging', 'read',
                f'resource.type=cloud_run_revision AND resource.labels.service_name={service_name}',
                '--project', self.project_id,
                '--limit', str(limit),
                '--format', 'value(textPayload)'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logs = [line for line in result.stdout.split('\n') if line.strip()]
                return logs
            else:
                return [f'Failed to fetch logs: {result.stderr}']
                
        except Exception as e:
            return [f'Log fetch error: {str(e)}']
