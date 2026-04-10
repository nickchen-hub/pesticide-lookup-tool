import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const FeedbackModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Encode form data payload for Netlify Form submission
    const encode = (data) => {
      return Object.keys(data)
        .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
        .join("&");
    };

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // Use the form name "feedback" exactly as hidden in index.html
        body: encode({ "form-name": "feedback", ...formData })
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setFormData({ name: '', email: '', message: '' });
        }, 3000);
      } else {
        throw new Error("發送失敗，請稍後再試");
      }
    } catch (err) {
      setError(err.message || "發生不可預期的錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-brand-primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="打開意見回饋表單"
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '450px',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                padding: '0.25rem',
                borderRadius: '50%',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-dark)', marginBottom: '0.5rem' }}>
              意見與回饋
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              有任何功能上的建議，或是想分享使用心得，歡迎留言給我們！您的意見是我們優化的動力。
            </p>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-brand-primary)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Send size={28} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>送出成功！</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>謝謝您的寶貴意見，我們會仔細閱讀。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="feedback-name">稱呼 <span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    id="feedback-name"
                    name="name" 
                    type="text" 
                    required
                    className="input-field" 
                    placeholder="怎麼稱呼您？"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label" htmlFor="feedback-email">聯絡信箱 <span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    id="feedback-email"
                    name="email" 
                    type="email" 
                    required
                    className="input-field" 
                    placeholder="請留下您的 Email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="feedback-message">留言內容 <span style={{color: '#ef4444'}}>*</span></label>
                  <textarea 
                    id="feedback-message"
                    name="message" 
                    required 
                    className="input-field" 
                    placeholder="請輸入您的建議或問題..."
                    rows={4}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}><p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p></div>}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '發送中...' : '送出留言'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackModal;
