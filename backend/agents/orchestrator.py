"""
ServerGem Orchestrator Agent
Uses Gemini's function calling for intelligent routing and decision-making
"""

import asyncio
from typing import Dict, List, Optional
import google.generativeai as genai
from datetime import datetime
import json

class OrchestratorAgent:
    """
    Central orchestrator using Gemini with function calling.
    Routes to specialist agents and maintains conversation context.
    """
    
    def __init__(self, gemini_api_key: str):
        genai.configure(api_key=gemini_api_key)
        
        # Use Gemini 2.0 Flash for speed + intelligence
        self.model = genai.GenerativeModel(
            'gemini-2.0-flash-exp',
            tools=[self._get_function_declarations()]
        )
        
        self.conversation_history: List[Dict] = []
        self.project_context: Dict = {}
        self.chat_session = None
    
    def _get_function_declarations(self) -> List[Dict]:
        """Define available functions for Gemini to call"""
        return [
            {
                'name': 'analyze_codebase',
                'description': 'Analyze user codebase to detect framework, dependencies, and configuration',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'repo_url': {'type': 'string', 'description': 'GitHub repository URL or local path'},
                        'branch': {'type': 'string', 'description': 'Git branch to analyze (default: main)'}
                    },
                    'required': ['repo_url']
                }
            },
            {
                'name': 'generate_dockerfile',
                'description': 'Generate optimized production Dockerfile for detected framework',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'framework': {'type': 'string', 'description': 'Detected framework (e.g., flask, express)'},
                        'language': {'type': 'string', 'description': 'Programming language'},
                        'entry_point': {'type': 'string', 'description': 'Main application file'}
                    },
                    'required': ['framework', 'language']
                }
            },
            {
                'name': 'deploy_to_cloudrun',
                'description': 'Deploy containerized application to Google Cloud Run',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'service_name': {'type': 'string', 'description': 'Cloud Run service name'},
                        'region': {'type': 'string', 'description': 'GCP region (default: us-central1)'},
                        'env_vars': {'type': 'object', 'description': 'Environment variables'},
                        'memory': {'type': 'string', 'description': 'Memory allocation (default: 512Mi)'},
                        'max_instances': {'type': 'integer', 'description': 'Max autoscaling instances (default: 10)'}
                    },
                    'required': ['service_name']
                }
            },
            {
                'name': 'setup_cloudsql',
                'description': 'Provision Cloud SQL database and connect to Cloud Run service',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'database_type': {'type': 'string', 'enum': ['postgresql', 'mysql'], 'description': 'Database type'},
                        'instance_name': {'type': 'string', 'description': 'Cloud SQL instance name'},
                        'tier': {'type': 'string', 'description': 'Instance tier (default: db-f1-micro)'}
                    },
                    'required': ['database_type']
                }
            },
            {
                'name': 'debug_deployment',
                'description': 'Analyze deployment logs and diagnose errors',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'service_name': {'type': 'string', 'description': 'Cloud Run service name'},
                        'error_message': {'type': 'string', 'description': 'Error message from logs'}
                    },
                    'required': ['service_name']
                }
            },
            {
                'name': 'optimize_costs',
                'description': 'Analyze and optimize Cloud Run cost configuration',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'service_name': {'type': 'string', 'description': 'Cloud Run service name'},
                        'current_costs': {'type': 'number', 'description': 'Current monthly costs in USD'}
                    },
                    'required': ['service_name']
                }
            },
            {
                'name': 'setup_cicd',
                'description': 'Configure CI/CD pipeline with Cloud Build',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'repo_url': {'type': 'string', 'description': 'GitHub repository URL'},
                        'branch': {'type': 'string', 'description': 'Branch to deploy from (default: main)'},
                        'trigger_type': {'type': 'string', 'enum': ['push', 'pull_request'], 'description': 'Trigger type'}
                    },
                    'required': ['repo_url']
                }
            }
        ]
    
    async def process_message(self, user_message: str, session_id: str) -> Dict:
        """Process user message and route to appropriate agents via function calling"""
        
        # Initialize chat session if needed
        if not self.chat_session:
            self.chat_session = self.model.start_chat(history=[])
        
        # Add context to message if available
        context_prefix = self._build_context_prefix()
        full_message = f"{context_prefix}\n\nUser: {user_message}" if context_prefix else user_message
        
        try:
            # Send message to Gemini with function calling enabled
            response = await asyncio.to_thread(
                self.chat_session.send_message,
                full_message
            )
            
            # Process function calls if any
            if response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call'):
                        return await self._handle_function_call(part.function_call)
            
            # Return text response if no function calls
            return {
                'type': 'text',
                'content': response.text,
                'timestamp': datetime.now().isoformat(),
                'actions': []
            }
        
        except Exception as e:
            return {
                'type': 'error',
                'content': f"Error processing message: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
    
    async def _handle_function_call(self, function_call) -> Dict:
        """Execute function call and return structured response"""
        
        function_name = function_call.name
        args = dict(function_call.args)
        
        # Route to appropriate handler
        handlers = {
            'analyze_codebase': self._handle_analyze_codebase,
            'generate_dockerfile': self._handle_generate_dockerfile,
            'deploy_to_cloudrun': self._handle_deploy_to_cloudrun,
            'setup_cloudsql': self._handle_setup_cloudsql,
            'debug_deployment': self._handle_debug_deployment,
            'optimize_costs': self._handle_optimize_costs,
            'setup_cicd': self._handle_setup_cicd
        }
        
        handler = handlers.get(function_name)
        if handler:
            return await handler(args)
        
        return {
            'type': 'error',
            'content': f"Unknown function: {function_name}"
        }
    
    async def _handle_analyze_codebase(self, args: Dict) -> Dict:
        """Trigger code analysis agent"""
        return {
            'type': 'action',
            'action': 'analyze_codebase',
            'content': f"🔍 Analyzing your codebase at `{args['repo_url']}`...\n\nThis will detect your framework, dependencies, and generate deployment recommendations.",
            'params': args,
            'actions': [
                {'label': 'View Analysis', 'action': 'show_analysis'},
                {'label': 'Generate Dockerfile', 'action': 'generate_dockerfile'}
            ]
        }
    
    async def _handle_generate_dockerfile(self, args: Dict) -> Dict:
        """Trigger Dockerfile generation"""
        return {
            'type': 'action',
            'action': 'generate_dockerfile',
            'content': f"🐳 Generating optimized Dockerfile for **{args['framework']}**...\n\nThis will include multi-stage builds, security hardening, and Cloud Run optimization.",
            'params': args,
            'actions': [
                {'label': 'Review Dockerfile', 'action': 'show_dockerfile'},
                {'label': 'Deploy Now', 'action': 'deploy_to_cloudrun'}
            ]
        }
    
    async def _handle_deploy_to_cloudrun(self, args: Dict) -> Dict:
        """Trigger Cloud Run deployment"""
        return {
            'type': 'action',
            'action': 'deploy_to_cloudrun',
            'content': f"🚀 Deploying **{args['service_name']}** to Cloud Run...\n\n**Region:** {args.get('region', 'us-central1')}\n**Memory:** {args.get('memory', '512Mi')}\n**Max Instances:** {args.get('max_instances', 10)}\n\nThis usually takes 2-3 minutes.",
            'params': args,
            'deployment_url': f"https://{args['service_name']}-xyz.run.app",
            'actions': [
                {'label': 'View Logs', 'action': 'view_logs'},
                {'label': 'Setup CI/CD', 'action': 'setup_cicd'}
            ]
        }
    
    async def _handle_setup_cloudsql(self, args: Dict) -> Dict:
        """Trigger Cloud SQL setup"""
        return {
            'type': 'action',
            'action': 'setup_cloudsql',
            'content': f"💾 Setting up Cloud SQL **{args['database_type']}** instance...\n\nThis will:\n- Create managed database instance\n- Configure private networking\n- Set up Cloud Run connection\n- Store credentials in Secret Manager",
            'params': args,
            'actions': [
                {'label': 'View Connection String', 'action': 'show_connection'},
                {'label': 'Continue Deployment', 'action': 'deploy_to_cloudrun'}
            ]
        }
    
    async def _handle_debug_deployment(self, args: Dict) -> Dict:
        """Trigger debug analysis"""
        return {
            'type': 'action',
            'action': 'debug_deployment',
            'content': f"🔧 Analyzing deployment issues for **{args['service_name']}**...\n\nChecking:\n- Container logs\n- Health check status\n- Network configuration\n- Environment variables",
            'params': args,
            'actions': [
                {'label': 'View Detailed Logs', 'action': 'view_logs'},
                {'label': 'Fix Automatically', 'action': 'auto_fix'}
            ]
        }
    
    async def _handle_optimize_costs(self, args: Dict) -> Dict:
        """Trigger cost optimization"""
        return {
            'type': 'action',
            'action': 'optimize_costs',
            'content': f"💰 Analyzing costs for **{args['service_name']}**...\n\nI'll recommend:\n- Right-sizing memory/CPU\n- Optimizing cold start times\n- Adjusting min/max instances\n- Request concurrency tuning",
            'params': args,
            'actions': [
                {'label': 'View Recommendations', 'action': 'show_recommendations'},
                {'label': 'Apply Optimizations', 'action': 'apply_optimizations'}
            ]
        }
    
    async def _handle_setup_cicd(self, args: Dict) -> Dict:
        """Trigger CI/CD setup"""
        return {
            'type': 'action',
            'action': 'setup_cicd',
            'content': f"⚙️ Setting up CI/CD pipeline...\n\n**Repository:** {args['repo_url']}\n**Branch:** {args.get('branch', 'main')}\n\nThis will:\n- Create Cloud Build trigger\n- Configure automatic deployments\n- Set up rollback capabilities",
            'params': args,
            'actions': [
                {'label': 'View Pipeline', 'action': 'show_pipeline'},
                {'label': 'Test Deployment', 'action': 'test_deployment'}
            ]
        }
    
    def _build_context_prefix(self) -> str:
        """Build context string from stored project data"""
        if not self.project_context:
            return ""
        
        context_parts = []
        if 'framework' in self.project_context:
            context_parts.append(f"Framework: {self.project_context['framework']}")
        if 'language' in self.project_context:
            context_parts.append(f"Language: {self.project_context['language']}")
        if 'service_name' in self.project_context:
            context_parts.append(f"Service: {self.project_context['service_name']}")
        
        return "Current project: " + ", ".join(context_parts) if context_parts else ""
    
    def update_context(self, key: str, value: any):
        """Update project context"""
        self.project_context[key] = value
    
    def get_context(self) -> Dict:
        """Get current project context"""
        return self.project_context


# Test orchestrator
async def test_orchestrator():
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    orchestrator = OrchestratorAgent(
        gemini_api_key=os.getenv('GEMINI_API_KEY')
    )
    
    test_messages = [
        "I want to deploy my Flask app from https://github.com/myuser/flask-api",
        "Can you set up a PostgreSQL database for my app?",
        "My deployment is failing with a 502 error",
        "How can I reduce my Cloud Run costs?"
    ]
    
    for msg in test_messages:
        print(f"\n{'='*60}")
        print(f"🧑 USER: {msg}")
        print(f"{'='*60}")
        response = await orchestrator.process_message(msg, session_id="test-123")
        print(f"🤖 SERVERGEM:\n{response['content']}")
        if response.get('actions'):
            print(f"\nActions: {[a['label'] for a in response['actions']]}")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
