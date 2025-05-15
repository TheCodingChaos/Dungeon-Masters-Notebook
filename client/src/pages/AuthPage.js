import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionContext } from '../contexts/SessionContext';
import Login from '../components/Login';
import Signup from '../components/Signup';
import '../styles/pages.css';

export default function AuthPage() {
  const { sessionData } = useContext(SessionContext);
  const user = sessionData?.user;
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [isDisplayingLogin, setIsDisplayingLogin] = useState(true);

  const handleToggleAuthForm = () => {
    setIsDisplayingLogin(prev => !prev);
  };

  const toggleButtonText = isDisplayingLogin
    ? 'Need an account? Sign Up'
    : 'Already have an account? Login';

  const FormComponentToRender = isDisplayingLogin ? <Login /> : <Signup />;

  // Prevent rendering when user is authenticated
  if (user) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        {FormComponentToRender}
        <button
          type="button"
          onClick={handleToggleAuthForm}
          className="button-link toggle-auth-form-button"
        >
          {toggleButtonText}
        </button>
      </div>
    </div>
  );
}