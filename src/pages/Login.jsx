import { useState, useEffect } from "react";
import { authService } from "../api/service";
import { Navigate, useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('username', formData.username.trim());
      params.append('password', formData.password);
      
      const response = await authService.login(params.toString());
      console.log("Login successful:", response);
      setIsSubmitted(true);
      
      // Set the redirect path based on the user's role
      const allowedRoutes = ["admin", "security", "user"];
      if (response && response.user && allowedRoutes.includes(response.user.role)) {
        setRedirectPath(`/${response.user.role}`);
      } else { 
        setRedirectPath("/");
      }
      
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle navigation after successful login
  useEffect(() => {
    if (isSubmitted && redirectPath) {
      // Short delay to show the success message before redirecting
      const redirectTimer = setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isSubmitted, redirectPath, navigate]);

  // If we have a redirectPath and isSubmitted, we can also use Navigate component
  if (isSubmitted && redirectPath) {
    return <Navigate to={redirectPath} />;
  }

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ maxWidth: "450px", width: "100%" }}>
        <h3 className="text-center mb-4">RBAC User Login</h3>
        
        {isSubmitted ? (
          <div className="alert alert-success text-center">
            Login successful! Redirecting to {redirectPath}...
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                className={`form-control form-control-lg ${error && !formData.username ? 'is-invalid' : ''}`}
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className={`form-control form-control-lg ${error && !formData.password ? 'is-invalid' : ''}`}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100 btn-lg mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : "Login"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;