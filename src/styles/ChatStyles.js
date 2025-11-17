/**
 * 🎨 Chat Styles
 * 
 * All style constants extracted from App.jsx for better organization.
 * These are the memoized style objects used throughout the chat interface.
 */

// Detect mobile from window (same logic as in App.jsx)
const isMobile = window.innerWidth <= 768;

// 📱 MESSAGE CONTAINERS
export const messageContainerBaseStyle = {
  display: 'flex',
  paddingBottom: '1.5rem',
  paddingLeft: window.innerWidth <= 768 ? '1rem' : (window.innerWidth <= 1200 ? '100px' : '100px'),
  paddingRight: window.innerWidth <= 768 ? '1rem' : (window.innerWidth <= 1200 ? '100px' : '100px')
};

export const userMessageContainerStyle = {
  ...messageContainerBaseStyle,
  justifyContent: 'flex-end',
  paddingBottom: '0.5rem'
};

export const botMessageContainerStyle = {
  ...messageContainerBaseStyle,
  justifyContent: 'flex-start',
  paddingBottom: '0.5rem'
};

// 🔄 LOADING STYLES
export const loadingContainerStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
  width: '100%'
};

export const loadingBoxStyle = {
  width: '95%',
  padding: '1.2rem',
  paddingLeft: '1rem',
  fontSize: '1rem',
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
  textAlign: 'left'
};

// 👤 USER MESSAGE STYLES
export const userContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.8rem',
  width: '100%',
  paddingLeft: '0',
  paddingRight: '0'
};

export const userBubbleStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  padding: '0.5rem 0.6rem',
  borderRadius: '12px',
  fontSize: '1rem',
  lineHeight: '1.3',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  width: 'fit-content',
  maxWidth: window.innerWidth <= 768 ? '85%' : (window.innerWidth <= 1200 ? '85%' : '75%'),
  maxHeight: window.innerWidth <= 768 ? '400px' : '500px',
  overflowY: 'auto'
};

// 🤖 BOT MESSAGE STYLES
export const botContainerStyle = {
  width: '100%',
  paddingTop: '0.5rem',
  fontSize: '1rem',
  lineHeight: '1.3',
  whiteSpace: 'normal',
  color: '#FFFFFF',
  textAlign: 'left'
};

export const botHeaderStyle = {
  fontSize: '0.75rem',
  opacity: 0.7,
  display: 'flex',
  alignItems: 'center',
  paddingBottom: '1.5rem'
};

export const botNameStyle = {
  fontWeight: '600',
  color: '#a0aec0',
  display: 'flex',
  alignItems: 'center'
};

// ⏳ LOADING ANIMATION STYLES
export const loadingAnimationContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem'
};

export const loadingSpinnerStyle = {
  width: '18px',
  height: '18px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTop: '2px solid #00ffff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  flexShrink: 0
};

export const loadingTextStyleStreaming = {
  color: '#00ffff',
  fontWeight: '500'
};

export const loadingTextStyleNormal = {
  color: '#a0aec0',
  fontWeight: '500'
};

export const loadingDotsContainerStyle = {
  display: 'flex',
  gap: '4px',
  alignItems: 'center'
};

// Base style for loading dots
const loadingDotBaseStyle = {
  animation: 'pulse 1.4s ease-in-out infinite',
  fontSize: '24px',
  textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
  color: '#00ffff',
  transform: 'translateZ(0)'
};

export const loadingDotStyle = loadingDotBaseStyle;

export const loadingDot2Style = {
  ...loadingDotBaseStyle,
  animation: 'pulse 1.4s ease-in-out 0.2s infinite'
};

export const loadingDot3Style = {
  ...loadingDotBaseStyle,
  animation: 'pulse 1.4s ease-in-out 0.4s infinite'
};

// 🖼️ IMAGE STYLES
export const imageStyle = {
  maxWidth: '280px',
  width: '100%',
  height: 'auto',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  transform: 'translateZ(0)'
};

export const userAttachmentsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  paddingTop: '1rem',
  width: '100%'
};

export const userAttachmentWrapperStyle = {
  paddingTop: '1rem',
  paddingBottom: '1rem',
  borderRadius: '12px',
  overflow: 'hidden',
  maxWidth: '100%'
};

// 📱 MODEL DROPDOWN STYLES
export const modelDropdownSpanStyle = {
  color: 'rgba(255, 255, 255, 0.9)'
};

export const modelDropdownIconStyle = {
  color: 'rgba(255, 255, 255, 0.9)'
};

export const modelDropdownContainerStyle = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '8px',
  minWidth: '220px',
  maxWidth: '280px',
  borderRadius: '12px',
  backgroundColor: 'rgba(55, 65, 81, 0.95)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  zIndex: 1001
};

export const modelButtonBaseStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '12px 16px',
  border: 'none',
  color: 'white',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit'
};

export const modelNameStyle = {
  fontWeight: '500'
};

export const modelDescriptionStyle = {
  marginLeft: 'auto',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.7)'
};

// 🏠 MAIN LAYOUT STYLES
export const mainContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Inter", sans-serif',
  width: '100%',
  margin: 0,
  transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden'
};

export const topHeaderStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  background: 'rgba(0, 0, 0, 0.1)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  zIndex: 1000
};

export const hamburgerButtonStyle = {
  borderRadius: '12px',
  border: 'none',
  background: 'transparent',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  outline: 'none'
};

export const newChatButtonStyle = {
  borderRadius: '12px',
  border: 'none',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  outline: 'none'
};

// 🔘 FLOATING CIRCULAR BUTTONS (ChatGPT Style)
export const floatingButtonBaseStyle = {
  position: 'fixed',
  top: '16px',
  width: '38px', // ✨ Smaller circle (was 44px)
  height: '38px',
  borderRadius: '50%',
  background: 'rgba(0, 0, 0, 0.2)', // ✨ More transparent - text visible through button
  backdropFilter: 'blur(15px)', // ✨ Stronger blur for glass effect
  WebkitBackdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.1)', // ✨ Subtle border for glass effect
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1000,
  outline: 'none',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' // ✨ Lighter shadow
};

export const floatingHamburgerButtonStyle = {
  ...floatingButtonBaseStyle,
  left: '16px'
};

export const floatingNewChatButtonStyle = {
  ...floatingButtonBaseStyle,
  right: '16px'
};

// 💬 CHAT CONTENT STYLES
export const mainContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  // 🔒 REMOVED overflow: hidden and position: relative - creating unnecessary containing blocks
  background: 'transparent'
};

export const messagesContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  // 🔒 REMOVED transform and position: relative - creating containing blocks
  maxWidth: window.innerWidth <= 768 ? '1000px' : (window.innerWidth <= 1200 ? '100%' : '100%'),
  margin: '0 auto',
  width: '100%'
};

// 🎉 WELCOME SCREEN STYLES
export const welcomeScreenStyle = {
  flex: 1,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};

export const welcomeTextContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem'
};

export const welcomeTitleStyle = {
  fontWeight: '700',
  margin: 0,
  color: '#ffffff',
  letterSpacing: '0.02em'
};

export const welcomeSubtitleStyle = {
  fontWeight: '400',
  margin: 0,
  color: 'rgba(255, 255, 255, 0.8)',
  letterSpacing: '0.01em'
};

// 🗨️ CHAT WRAPPER STYLES
export const chatMessagesWrapperStyle = {
  flex: 1,
  // 🔒 REMOVED position: relative, zIndex, overflowY: hidden
  // These created containing blocks and prevented proper scroll behavior
  // Virtuoso handles its own overflow and scroll
};

// 📜 VIRTUOSO STYLES
export const virtuosoStyle = {
  width: '100%',
  flex: 1,
  overflowY: 'auto',
  overscrollBehavior: 'none'
};

export const virtuosoFooterStyle = {
  height: '450px'
};

export const virtuosoInlineStyle = {
  width: '100%',
  flex: 1,
  overflowY: 'auto',  // ✅ Virtuoso is THE scroll container
  overscrollBehavior: 'auto',  // ✅ Use browser default (better Android compatibility)
  // 🔒 REMOVED position: relative and zIndex - don't create containing block
  // Virtuoso handles its own scrolling without needing positioning context
};

// Export all styles as a single object for convenience
export const chatStyles = {
  messageContainerBaseStyle,
  userMessageContainerStyle,
  botMessageContainerStyle,
  loadingContainerStyle,
  loadingBoxStyle,
  userContainerStyle,
  userBubbleStyle,
  botContainerStyle,
  botHeaderStyle,
  botNameStyle,
  loadingAnimationContainerStyle,
  loadingSpinnerStyle,
  loadingTextStyleStreaming,
  loadingTextStyleNormal,
  loadingDotsContainerStyle,
  loadingDotStyle,
  loadingDot2Style,
  loadingDot3Style,
  imageStyle,
  userAttachmentsContainerStyle,
  userAttachmentWrapperStyle,
  modelDropdownSpanStyle,
  modelDropdownIconStyle,
  modelDropdownContainerStyle,
  modelButtonBaseStyle,
  modelNameStyle,
  modelDescriptionStyle,
  mainContainerStyle,
  topHeaderStyle,
  hamburgerButtonStyle,
  newChatButtonStyle,
  floatingButtonBaseStyle,
  floatingHamburgerButtonStyle,
  floatingNewChatButtonStyle,
  mainContentStyle,
  messagesContainerStyle,
  welcomeScreenStyle,
  welcomeTextContainerStyle,
  welcomeTitleStyle,
  welcomeSubtitleStyle,
  chatMessagesWrapperStyle,
  virtuosoStyle,
  virtuosoFooterStyle,
  virtuosoInlineStyle
};