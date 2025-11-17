/**
 * 📊 SUMMARY CARD COMPONENT
 *
 * Displays conversation summary in a collapsible card
 * Part of Elora's memory system
 */

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SummaryCard = ({ summaryContent, summarizedCount }) => {
  const { isDark, isLight, isElora } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Try to parse JSON summary, fallback to plaintext
  const parseSummary = (content) => {
    try {
      const parsed = JSON.parse(content);
      return { isJSON: true, data: parsed };
    } catch {
      return { isJSON: false, data: content };
    }
  };

  const summaryData = parseSummary(summaryContent);

  // Theme-aware colors
  const getCardStyle = () => {
    if (isDark) {
      return {
        backgroundColor: 'rgba(120, 120, 120, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textColor: '#FFFFFF',
        borderTopColor: 'rgba(255, 255, 255, 0.15)'
      };
    } else if (isElora) {
      return {
        backgroundColor: 'rgba(100, 50, 255, 0.1)',
        border: '1px solid rgba(100, 50, 255, 0.4)',
        textColor: '#FFFFFF',
        borderTopColor: 'rgba(100, 50, 255, 0.3)'
      };
    } else {
      // Light Cream
      return {
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
        border: '1px solid #ff6b35',
        textColor: '#000000',
        borderTopColor: 'rgba(255, 107, 53, 0.3)'
      };
    }
  };

  const cardStyle = getCardStyle();

  // Render JSON summary in user-friendly format (Elora AGENT_PROMPT v2 schema)
  const renderJSONSummary = (data) => {
    const summary = data.summary || data; // Handle both wrapped and unwrapped formats

    return (
      <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
        {/* User Profile */}
        {summary.user_profile && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', opacity: 0.9 }}>
              👤 User Profile
            </div>
            <div style={{ paddingLeft: '12px', opacity: 0.85 }}>
              <div><strong>Name:</strong> {summary.user_profile.name || 'N/A'}</div>
              <div><strong>Role:</strong> {summary.user_profile.role || 'N/A'}</div>
              {summary.user_profile.background && (
                <div><strong>Background:</strong> {summary.user_profile.background}</div>
              )}
              {summary.user_profile.working_style && (
                <div><strong>Working style:</strong> {summary.user_profile.working_style}</div>
              )}
            </div>
          </div>
        )}

        {/* Project State */}
        {summary.project_state && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', opacity: 0.9 }}>
              🚀 Project
            </div>
            <div style={{ paddingLeft: '12px', opacity: 0.85 }}>
              <div><strong>Name:</strong> {summary.project_state.name || 'N/A'}</div>
              {summary.project_state.purpose && (
                <div><strong>Purpose:</strong> {summary.project_state.purpose}</div>
              )}
              {summary.project_state.status && (
                <div><strong>Status:</strong> {summary.project_state.status}</div>
              )}
              {summary.project_state.current_milestone && (
                <div><strong>Current:</strong> {summary.project_state.current_milestone}</div>
              )}
              {summary.project_state.next_action && (
                <div><strong>Next:</strong> {summary.project_state.next_action}</div>
              )}
              {summary.project_state.blocker && (
                <div style={{ color: '#ff6666' }}><strong>⚠️ Blocker:</strong> {summary.project_state.blocker}</div>
              )}
            </div>
          </div>
        )}

        {/* Roadmap */}
        {summary.roadmap && summary.roadmap.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', opacity: 0.9 }}>
              🗺️ Roadmap
            </div>
            <div style={{ paddingLeft: '12px', opacity: 0.85 }}>
              {summary.roadmap.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  {item.status} {item.item}
                  {item.notes && <span style={{ opacity: 0.7, fontSize: '12px' }}> — {item.notes}</span>}
                </div>
              ))}
              {summary.roadmap.length > 5 && (
                <div style={{ opacity: 0.6, fontSize: '12px' }}>
                  +{summary.roadmap.length - 5} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Open Questions */}
        {summary.open_questions && summary.open_questions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', opacity: 0.9 }}>
              ❓ Open Questions
            </div>
            <div style={{ paddingLeft: '12px', opacity: 0.85 }}>
              {summary.open_questions.map((q, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>• {q}</div>
              ))}
            </div>
          </div>
        )}

        {/* Context for Elora */}
        {summary.context_for_elora && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', opacity: 0.9 }}>
              💡 Context for Elora
            </div>
            <div style={{ paddingLeft: '12px', opacity: 0.85 }}>
              {summary.context_for_elora.elora_role && (
                <div><strong>Role:</strong> {summary.context_for_elora.elora_role}</div>
              )}
              {summary.context_for_elora.communication_style && (
                <div><strong>Style:</strong> {summary.context_for_elora.communication_style}</div>
              )}
              {summary.context_for_elora.focus_areas && summary.context_for_elora.focus_areas.length > 0 && (
                <div><strong>Focus:</strong> {summary.context_for_elora.focus_areas.join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Security Alerts */}
        {data.security?.alerts && data.security.alerts.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', opacity: 0.9, color: '#ff4444' }}>
              🚨 Security Alerts
            </div>
            <div style={{ paddingLeft: '12px', opacity: 0.85 }}>
              {data.security.alerts.map((alert, idx) => (
                <div key={idx} style={{ marginBottom: '4px', color: '#ff6666' }}>
                  [{alert.type}] {alert.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {data.metadata && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${cardStyle.borderTopColor}`, opacity: 0.6, fontSize: '11px' }}>
            {data.metadata.word_count && <span>Words: {data.metadata.word_count} • </span>}
            {data.metadata.compression_ratio !== undefined && (
              <span>Compression: {Math.round(data.metadata.compression_ratio * 100)}%</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`summary-card ${isDark ? 'dark' : isElora ? 'omnia' : 'light'}`}
      style={{
        backgroundColor: cardStyle.backgroundColor,
        border: cardStyle.border,
        borderRadius: '12px',
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <span
          style={{
            fontWeight: '600',
            fontSize: '14px',
            color: cardStyle.textColor
          }}
        >
          Conversation Summary
        </span>

        <span
          style={{
            fontSize: '12px',
            color: cardStyle.textColor,
            opacity: 0.8,
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ▼
        </span>
      </div>

      {/* Content (collapsible) - Always rendered with smooth transition */}
      <div
        style={{
          maxHeight: isExpanded ? '500px' : '0',
          overflowY: isExpanded ? 'auto' : 'hidden',
          transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out, margin-top 0.3s ease-in-out, padding-top 0.3s ease-in-out',
          opacity: isExpanded ? 0.9 : 0,
          marginTop: isExpanded ? '12px' : '0',
          paddingTop: isExpanded ? '12px' : '0',
          borderTop: isExpanded ? `1px solid ${cardStyle.borderTopColor}` : 'none',
          fontSize: '13px',
          lineHeight: '1.6',
          color: cardStyle.textColor,
          whiteSpace: summaryData.isJSON ? 'normal' : 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {summaryData.isJSON ? renderJSONSummary(summaryData.data) : summaryContent}
      </div>

      {/* Hint text when collapsed */}
      {!isExpanded && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: cardStyle.textColor,
            opacity: 0.5,
            fontStyle: 'italic'
          }}
        >
          Click to expand summary
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
