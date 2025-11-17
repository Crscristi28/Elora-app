/**
 * 🔔 Notification Utilities
 * 
 * Enhanced notification system with search state detection and beautiful styling
 */

// 🔧 NOTIFICATION SYSTEM (ENHANCED)
export const createNotificationSystem = (setIsSearching) => {
  // Add CSS animation keyframes to document head if not already present
  if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
      @keyframes errorPulse {
        0%, 100% { 
          box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 0 20px rgba(220, 53, 69, 0.3);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 0 30px rgba(220, 53, 69, 0.5);
          transform: scale(1.02);
        }
      }
    `;
    document.head.appendChild(style);
  }

  const showNotification = (message, type = 'info', onClick = null) => {
    // Detect search messages and update state
    const searchKeywords = ['hledá', 'searching', 'caută', 'google', 'search'];
    if (searchKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      setIsSearching(true);
      // Reset search state when search is done
      setTimeout(() => setIsSearching(false), 3000);
    }
    const notification = document.createElement('div');
    
    const baseStyle = `
      position: fixed; top: 80px; right: 20px; padding: 12px 18px; border-radius: 12px;
      font-size: 14px; z-index: 10000; cursor: ${onClick ? 'pointer' : 'default'};
      box-shadow: 0 8px 25px rgba(0,0,0,0.3); font-weight: 500; max-width: 350px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px);
      display: flex; align-items: center; gap: 8px;
    `;
    
    const typeStyles = {
      error: 'background: linear-gradient(135deg, rgba(220, 53, 69, 0.25), rgba(200, 35, 51, 0.25)); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.4); animation: errorPulse 2s ease-in-out infinite;',
      success: 'background: linear-gradient(135deg, rgba(40, 167, 69, 0.25), rgba(32, 201, 151, 0.25)); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.4);',
      info: 'background: linear-gradient(135deg, rgba(0, 123, 255, 0.25), rgba(0, 150, 255, 0.25)); color: #007bff; border: 1px solid rgba(0, 123, 255, 0.4);'
    };
    
    notification.style.cssText = baseStyle + (typeStyles[type] || typeStyles.info);
    
    const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
    notification.innerHTML = `
      <span style="font-size: 16px;">${icons[type] || icons.info}</span>
      <span>${message}</span>
      ${onClick ? '<span style="margin-left: auto; font-size: 12px; opacity: 0.8;">↗️</span>' : ''}
    `;
    
    if (onClick) {
      notification.addEventListener('click', () => {
        onClick();
        document.body.removeChild(notification);
      });
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px) scale(0.9)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 400);
      }
    }, type === 'error' ? 5000 : 4000);
  };
  
  return { showNotification };
};