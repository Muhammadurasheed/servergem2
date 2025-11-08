import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvFileUploadProps {
  onEnvParsed: (envVars: EnvVariable[]) => void;
}

export function EnvFileUpload({ onEnvParsed }: EnvFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedEnvs, setParsedEnvs] = useState<EnvVariable[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse .env file content
  const parseEnvFile = (content: string): EnvVariable[] => {
    const lines = content.split('\n');
    const envVars: EnvVariable[] = [];
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }
      
      // Parse KEY=VALUE format
      const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Detect if it's likely a secret
        const isSecret = detectSecret(key, value);
        
        envVars.push({ key, value, isSecret });
      }
    }
    
    return envVars;
  };

  // Smart secret detection
  const detectSecret = (key: string, value: string): boolean => {
    const secretKeywords = [
      'password', 'secret', 'key', 'token', 'api_key', 'apikey',
      'auth', 'credential', 'private', 'salt', 'hash', 'jwt',
      'access', 'refresh', 'session'
    ];
    
    const keyLower = key.toLowerCase();
    const hasSecretKeyword = secretKeywords.some(keyword => 
      keyLower.includes(keyword)
    );
    
    // Also check if value looks like a secret (long random string)
    const looksLikeSecret = value.length > 20 && /^[A-Za-z0-9_\-+=\/]+$/.test(value);
    
    return hasSecretKeyword || looksLikeSecret;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);
    
    try {
      const content = await file.text();
      const envVars = parseEnvFile(content);
      
      if (envVars.length === 0) {
        toast.error('No environment variables found in file');
        setUploadedFile(null);
        return;
      }
      
      setParsedEnvs(envVars);
      onEnvParsed(envVars);
      toast.success(`Successfully parsed ${envVars.length} environment variables`);
    } catch (error) {
      console.error('Error parsing .env file:', error);
      toast.error('Failed to parse .env file. Please check the format.');
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name === '.env' || file.name.endsWith('.env') || file.type === 'text/plain')) {
      handleFileUpload(file);
    } else {
      toast.error('Please upload a .env file');
    }
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setParsedEnvs([]);
  };

  return (
    <div className="env-file-upload">
      {!uploadedFile ? (
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="upload-icon" size={48} />
          <h3 className="upload-title">Upload Environment Variables</h3>
          <p className="upload-description">Drag and drop your .env file here</p>
          <span className="upload-or">or</span>
          <label className="upload-button">
            <input
              type="file"
              accept=".env,text/plain"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            Browse Files
          </label>
          <div className="upload-hint">
            📄 We support standard .env format
          </div>
        </div>
      ) : (
        <div className="upload-success">
          <div className="success-header">
            <CheckCircle className="success-icon" size={24} />
            <span className="success-text">
              {uploadedFile.name} uploaded successfully
            </span>
          </div>
          
          {isProcessing ? (
            <div className="processing">
              <div className="spinner">⟳</div>
              <span>Parsing environment variables...</span>
            </div>
          ) : (
            <div className="parsed-envs">
              <h4 className="parsed-title">Found {parsedEnvs.length} environment variables:</h4>
              <div className="env-list">
                {parsedEnvs.map((env, index) => (
                  <div key={index} className="env-item">
                    <div className="env-key">
                      {env.isSecret && <span className="secret-badge">🔒 Secret</span>}
                      <code>{env.key}</code>
                    </div>
                    <div className="env-value">
                      {env.isSecret ? (
                        <span className="hidden-value">••••••••</span>
                      ) : (
                        <code>{env.value.substring(0, 50)}
                          {env.value.length > 50 ? '...' : ''}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="env-actions">
                <button 
                  onClick={handleReset}
                  className="secondary-btn"
                >
                  <X size={16} />
                  Upload Different File
                </button>
              </div>
              
              <div className="security-note">
                <AlertCircle size={16} />
                <span>
                  Variables marked as secrets will be stored securely in Google Secret Manager
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
