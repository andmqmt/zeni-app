interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function Loading({ text, size = 'md', fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 dark:border-gray-700`}></div>
        <div className={`${sizeClasses[size]} absolute inset-0 rounded-full border-4 border-transparent border-t-gray-900 dark:border-t-gray-100 animate-spin`}></div>
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-gray-600 dark:text-gray-400 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
        {content}
      </div>
    );
  }

  return content;
}
