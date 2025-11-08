import { motion } from 'framer-motion';
import { DeploymentProgress } from '@/types/deployment';

interface MinimizedDeploymentIndicatorProps {
  progress: DeploymentProgress;
  onExpand: () => void;
}

export function MinimizedDeploymentIndicator({
  progress,
  onExpand,
}: MinimizedDeploymentIndicatorProps) {
  return (
    <motion.div
      className="minimized-deployment"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      onClick={onExpand}
    >
      <div className="minimized-content">
        <motion.div
          className="minimized-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          ⚡
        </motion.div>
        <div className="minimized-text">
          <span className="minimized-label">Deploying {progress.serviceName}...</span>
          <span className="minimized-progress">{progress.overallProgress}%</span>
        </div>
        <div className="minimized-bar">
          <motion.div
            className="minimized-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress.overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
