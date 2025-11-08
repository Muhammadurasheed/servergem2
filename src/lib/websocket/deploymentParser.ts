import { StageUpdate } from '@/types/deployment';

/**
 * Parse backend log messages into structured deployment stage updates
 */
export const parseBackendLog = (message: string): StageUpdate | null => {
  // Repository cloning - starting
  if (message.includes('[GitHubService] Cloning') || message.includes('Cloning repository')) {
    return {
      stage: 'repo_access',
      status: 'in-progress',
      details: ['Cloning repository from GitHub...'],
      progress: 5,
    };
  }

  // Repository cloning - complete
  if ((message.includes('Cloning') && message.includes('to')) || message.includes('Repository cloned')) {
    const match = message.match(/to (.+)/);
    return {
      stage: 'repo_access',
      status: 'success',
      details: [
        'Cloned from GitHub',
        `Location: ${match ? match[1] : 'local cache'}`,
      ],
      progress: 15,
    };
  }

  // Code analysis - starting
  if (message.includes('[AnalysisService] Analyzing project') || message.includes('Starting code analysis')) {
    return {
      stage: 'code_analysis',
      status: 'in-progress',
      details: ['Detecting framework and dependencies...'],
      progress: 20,
    };
  }

  // Code analysis - scanning
  if (message.includes('Analyzing project at')) {
    return {
      stage: 'code_analysis',
      status: 'in-progress',
      details: ['Scanning project structure...'],
      progress: 25,
    };
  }

  // Code analysis - framework detection
  if (message.includes('Detected framework') || message.match(/framework.*detected/i)) {
    const match = message.match(/(?:framework[:\s]+|detected\s+)(\w+)/i);
    const framework = match ? match[1] : 'unknown';
    return {
      stage: 'code_analysis',
      status: 'in-progress',
      details: [
        `Framework detected: ${framework}`,
        'Analyzing dependencies...',
      ],
      progress: 30,
    };
  }

  // Code analysis - complete
  if (message.includes('Analysis complete') || message.includes('analysis_result')) {
    return {
      stage: 'code_analysis',
      status: 'success',
      details: [
        'Framework and runtime identified',
        'Dependencies analyzed',
        'Configuration validated',
      ],
      progress: 35,
    };
  }

  // Dockerfile generation - starting
  if (message.includes('[AnalysisService] Generating Dockerfile') || message.includes('Generating Dockerfile')) {
    const match = message.match(/Generating Dockerfile for (\w+)/);
    const framework = match ? match[1] : 'detected framework';
    return {
      stage: 'dockerfile_generation',
      status: 'in-progress',
      details: [
        `Framework: ${framework}`,
        'Creating optimized Docker configuration...',
      ],
      progress: 40,
    };
  }

  // Dockerfile generation - complete
  if (message.includes('[DockerService] Dockerfile saved') || message.includes('Dockerfile created')) {
    return {
      stage: 'dockerfile_generation',
      status: 'success',
      details: [
        'Multi-stage build configured',
        'Security best practices applied',
        'Layer caching optimized',
      ],
      progress: 50,
    };
  }

  // Security scan - starting
  if (message.includes('Security scan') || message.includes('Scanning for vulnerabilities')) {
    return {
      stage: 'security_scan',
      status: 'in-progress',
      details: ['Scanning for vulnerabilities...'],
      progress: 55,
    };
  }

  // Security scan - complete
  if (message.includes('Security scan complete') || message.includes('No vulnerabilities')) {
    return {
      stage: 'security_scan',
      status: 'success',
      details: ['Security checks passed'],
      progress: 60,
    };
  }

  // Container build - starting
  if (message.includes('Building container image') || message.includes('[DockerService] Building')) {
    return {
      stage: 'container_build',
      status: 'in-progress',
      details: ['Building Docker image...'],
      progress: 65,
    };
  }

  // Container build - progress
  if (message.includes('Building') && message.includes('%')) {
    const match = message.match(/(\d+)%/);
    const buildProgress = match ? parseInt(match[1]) : 0;
    return {
      stage: 'container_build',
      status: 'in-progress',
      details: [`Build progress: ${buildProgress}%`],
      progress: 65 + (buildProgress * 0.15), // Scale to 65-80%
    };
  }

  // Container build - complete
  if (message.includes('Container image built') || message.includes('Build complete')) {
    return {
      stage: 'container_build',
      status: 'success',
      details: ['Image built successfully'],
      progress: 80,
    };
  }

  // Cloud deployment - starting
  if (message.includes('Deploying to Cloud Run') || message.includes('[GCloudService] Deploying')) {
    return {
      stage: 'cloud_deployment',
      status: 'in-progress',
      details: ['Launching service on Cloud Run...'],
      progress: 85,
    };
  }

  // Cloud deployment - progress
  if (message.includes('Deployment progress')) {
    return {
      stage: 'cloud_deployment',
      status: 'in-progress',
      details: ['Configuring service...'],
      progress: 90,
    };
  }

  // Cloud deployment - complete
  if (message.includes('Deployment successful') || message.includes('deployed successfully') || message.includes('Service URL:')) {
    return {
      stage: 'cloud_deployment',
      status: 'success',
      details: ['Service deployed successfully!'],
      progress: 100,
    };
  }

  // Error detection
  if (message.includes('Error:') || message.includes('Failed:') || message.includes('[ERROR]')) {
    return {
      stage: 'unknown',
      status: 'error',
      message: message,
      progress: 0,
    };
  }

  return null;
};

/**
 * Calculate duration between two timestamps
 */
export const calculateDuration = (startTime?: string, endTime?: string): number => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / 1000);
};

/**
 * Generate unique deployment ID
 */
export const generateDeploymentId = (): string => {
  return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
