// 💰 PricingModal.jsx - Modern pricing modal for Omnia subscription plans
import React from 'react';
import { X, Check, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const PricingModal = ({ 
  isOpen, 
  onClose,
  currentPlan = 'free' // 'free', 'premium-monthly', 'premium-quarterly'
}) => {
  const { isDark, isLight, isElora } = useTheme();

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      currency: 'Free',
      period: 'forever',
      badge: null,
      features: [
        '20 messages per day',
        '3 file uploads daily',
        '3 image generations daily',
        'Basic AI models',
        'Standard support'
      ],
      buttonText: currentPlan === 'free' ? 'Current Plan' : 'Downgrade',
      buttonDisabled: currentPlan === 'free',
      gradient: 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.9))',
      borderColor: currentPlan === 'free' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'
    },
    {
      id: 'premium-monthly',
      name: 'Premium',
      price: '350',
      currency: 'Kč',
      period: 'per month',
      badge: null,
      features: [
        'Unlimited messages',
        'Unlimited file uploads',
        'Unlimited image generations',
        'All AI models access',
        'Priority support',
        'Advanced features'
      ],
      buttonText: currentPlan === 'premium-monthly' ? 'Current Plan' : 'Upgrade Now',
      buttonDisabled: currentPlan === 'premium-monthly',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9))',
      borderColor: currentPlan === 'premium-monthly' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.15)'
    },
    {
      id: 'premium-quarterly',
      name: 'Premium',
      price: '900',
      currency: 'Kč',
      period: 'for 3 months',
      badge: 'SAVE 25%',
      features: [
        'Unlimited messages',
        'Unlimited file uploads', 
        'Unlimited image generations',
        'All AI models access',
        'Priority support',
        'Advanced features'
      ],
      buttonText: currentPlan === 'premium-quarterly' ? 'Current Plan' : 'Best Value',
      buttonDisabled: currentPlan === 'premium-quarterly',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.9))',
      borderColor: currentPlan === 'premium-quarterly' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(255, 255, 255, 0.15)',
      popular: true
    }
  ];

  return (
    <>
      {/* MODAL OVERLAY */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* MODAL CONTENT */}
        <div 
          style={{
            width: '100vw',
            height: '100vh',
            background: isDark
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(10, 10, 10, 0.95))'
              : isElora
                ? 'linear-gradient(135deg, rgba(0, 4, 40, 0.95), rgba(0, 78, 146, 0.90))'
                : '#FDFBF7',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : isLight
                ? '1px solid rgba(0, 0, 0, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER - Fixed Top */}
          <div style={{
            padding: '2rem 2rem 1rem',
            borderBottom: isLight
              ? '1px solid rgba(0, 0, 0, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            <div style={{
              textAlign: 'center',
              width: '100%'
            }}>
              <h1 style={{
                color: isLight ? '#000000' : 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 0 1rem 0'
              }}>
                Choose Your Plan
              </h1>
              <p style={{
                color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                margin: 0,
                fontWeight: '400'
              }}>
                Unlock the full potential of Omnia AI
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                background: 'transparent',
                border: 'none',
                color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                outline: 'none',
                padding: '0.25rem',
                borderRadius: '6px',
                fontSize: '1.25rem',
                lineHeight: 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            <div 
              className="pricing-cards-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1rem',
                width: '100%',
                alignItems: 'stretch'
              }}
            >
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                style={{
                  width: '100%',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: currentPlan === plan.id
                    ? (isLight ? '2px solid #ff6b35' : '2px solid rgba(59, 130, 246, 0.8)')
                    : (isLight ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(255, 255, 255, 0.1)'),
                  padding: '1.5rem',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                  position: 'relative'
                }}
              >
                {/* SAVE BADGE */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '1rem',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: isLight ? '#000000' : 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                  }}>
                    {plan.badge}
                  </div>
                )}
                
                {/* MOST POPULAR BADGE */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '1rem',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: isLight ? '#000000' : 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                  }}>
                    <Star size={10} fill="currentColor" />
                    POPULAR
                  </div>
                )}

                {/* PLAN HEADER */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      color: isLight ? '#000000' : 'white',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {plan.name}
                    </h3>
                    <p style={{
                      color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      margin: 0
                    }}>
                      {plan.period}
                    </p>
                  </div>
                  
                  {/* PRICE */}
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      color: isLight ? '#000000' : 'white',
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {plan.price} {plan.currency}
                    </div>
                  </div>
                </div>

                {/* FEATURES */}
                <div style={{
                  marginBottom: '1.5rem'
                }}>
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        color: isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      <Check 
                        size={14} 
                        style={{ 
                          color: '#10B981',
                          flexShrink: 0
                        }} 
                        strokeWidth={3}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA BUTTON */}
                <button
                  disabled={plan.buttonDisabled}
                  style={{
                    width: '100%',
                    background: plan.buttonDisabled
                      ? 'rgba(255, 255, 255, 0.1)'
                      : isLight
                        ? '#ff6b35'
                        : 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: plan.buttonDisabled
                      ? (isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)')
                      : (isLight ? '#ffffff' : '#1F2937'),
                    cursor: plan.buttonDisabled ? 'default' : 'pointer',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    opacity: plan.buttonDisabled ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.buttonDisabled) {
                      e.target.style.background = isLight ? '#e55a1f' : 'rgba(255, 255, 255, 1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.buttonDisabled) {
                      e.target.style.background = isLight ? '#ff6b35' : 'rgba(255, 255, 255, 0.95)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
            </div>
          </div>

          {/* FOOTER */}
          <div style={{
            padding: '1rem 2rem 6rem', // Extra bottom padding for mobile safe area
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <p style={{
              color: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem',
              margin: 0,
              fontWeight: '400'
            }}>
              All plans include secure data handling and regular updates
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        /* Responsive grid layout */
        @media (min-width: 768px) {
          .pricing-cards-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 2rem !important;
            max-width: 1200px !important;
            margin: 0 auto !important;
          }
        }
        
        @media (max-width: 767px) {
          .pricing-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default PricingModal;