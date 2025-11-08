import { motion, AnimatePresence } from 'framer-motion';
import { DeploymentProgress } from '@/types/deployment';
import { DeploymentStage } from './DeploymentStage';
import { ProgressBar } from './ProgressBar';
import { DeploymentSuccessPanel } from './DeploymentSuccessPanel';
import { DeploymentErrorPanel } from './DeploymentErrorPanel';
import { Button } from '@/components/ui/button';
import { Minimize2, X } from 'lucide-react';
import { calculateDuration } from '@/lib/websocket/deploymentParser';

interface DeploymentProgressPanelProps {
  progress: DeploymentProgress;
  onClose: () => void;
  onMinimize: () => void;
}

export function DeploymentProgressPanel({
  progress,
  onClose,
  onMinimize,
}: DeploymentProgressPanelProps) {
  const totalDuration = calculateDuration(progress.startTime, new Date().toISOString());

  // Show success panel
  if (progress.status === 'success') {
    return (
      <div className="deployment-panel-overlay">
        <DeploymentSuccessPanel
          deploymentUrl={progress.deploymentUrl || ''}
          duration={totalDuration}
          serviceName={progress.serviceName}
          onClose={onClose}
        />
      </div>
    );
  }

  // Show error panel
  if (progress.status === 'failed' && progress.error) {
    return (
      <div className="deployment-panel-overlay">
        <DeploymentErrorPanel
          error={progress.error}
          onCancel={onClose}
          onViewLogs={() => console.log('View logs')}
        />
      </div>
    );
  }

  // Show progress panel (default)
  return (
    <AnimatePresence>
      <div className="deployment-panel-overlay">
        <motion.div
          className="deployment-panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Header */}
          <div className="deployment-panel-header">
            <div className="header-content">
              <span className="header-icon">🚀</span>
              <h2 className="header-title">Deploying {progress.serviceName}</h2>
            </div>
            <div className="header-actions">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMinimize}
                className="text-slate-400 hover:text-white"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="deployment-panel-body">
            {progress.stages.map((stage) => (
              <DeploymentStage
                key={stage.id}
                stage={stage}
                isActive={stage.id === progress.currentStage}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="deployment-panel-footer">
            <ProgressBar
              progress={progress.overallProgress}
              estimatedTimeRemaining={progress.estimatedTimeRemaining}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
