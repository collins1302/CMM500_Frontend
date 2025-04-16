import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { authService } from "../api/service";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  
  // User state with initial empty values
  const [user, setUser] = useState({
    username: "",
    role: "",
    email: "",
    phone: "",
    mfaEnabled: false,
  });
  
  // Profile form state
  const [profile, setProfile] = useState({
    email: "",
    phone: "",
  });
  
  // User activity logs
  const [logs, setLogs] = useState([]);
  
  // Password change form state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Get current user info
    const getCurrentUser = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          // Redirect to login if no user found
          navigate("/login");
          return;
        }
        
        // Set user data
        const userData = {
          username: currentUser.username,
          role: currentUser.role || "user",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          mfaEnabled: currentUser.mfaEnabled || false
        };
        
        setUser(userData);
        // Initialize profile form with current values
        setProfile({
          email: userData.email,
          phone: userData.phone
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    // Get user activity logs
    const fetchUserLogs = async () => {
      try {
        const logResponse = await authService.getLogs();
        // Transform logs to match component's expected format
        const transformedLogs = logResponse.map(log => ({
          id: log.id,
          type: log.event_type,
          timestamp: formatTimestamp(log.timestamp),
          ip: log.ip_address,
          description: log.description
        }));
        setLogs(transformedLogs);
      } catch (error) {
        console.error("Failed to fetch user logs:", error);
        // Set some default logs if API fails
        setLogs([
          { id: 1, type: "LOGIN_SUCCESS", timestamp: formatTimestamp(new Date()), ip: "127.0.0.1" }
        ]);
      }
    };
    
    getCurrentUser();
    fetchUserLogs();
  }, [navigate]);
  
  // Format timestamp from ISO to more readable format
  const formatTimestamp = (isoTimestamp) => {
    try {
      const date = new Date(isoTimestamp);
      return date.toLocaleString();
    } catch (e) {
      return isoTimestamp;
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try { 
      await authService.updateProfile(profile);
      // Update local state
      setUser({ ...user, ...profile });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    
    try { 
      await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      alert("Password updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      // Close modal using Bootstrap's API
      const passwordModal = document.getElementById('passwordModal');
      const bsModal = bootstrap.Modal.getInstance(passwordModal);
      bsModal?.hide();
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to update password. Please check your current password and try again.");
    }
  };

  const toggleMFA = async () => {
    try {
      // Call API to toggle MFA
      if (user.mfaEnabled) {
        await authService.enableMFA();
      } else {
        await authService.enableMFA();
      }
      
      // Update local state
      setUser({ ...user, mfaEnabled: !user.mfaEnabled });
      alert(user.mfaEnabled ? "MFA Disabled" : "MFA Enabled");
      
      // Close modal using Bootstrap's API
      const mfaModal = document.getElementById('mfaModal');
      const bsModal = bootstrap.Modal.getInstance(mfaModal);
      bsModal?.hide();
    } catch (error) {
      console.error("Error toggling MFA:", error);
      alert("Failed to update MFA settings. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/login");
    }
  };

  // Get log class based on type
  const getLogClass = (type) => {
    switch (type) {
      case "FAILED_LOGIN":
      case "FAILED_LOGIN_ATTEMPT":
        return "table-warning";
      case "UNAUTHORIZED_ACCESS":
        return "table-danger";
      case "PASSWORD_CHANGE":
      case "MFA_ENABLED":
      case "MFA_DISABLED":
        return "table-info";
      default:
        return "";
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar Navigation */}
      <div className="bg-dark text-white vh-100 p-3" style={{ width: "250px" }}>
        <h4 className="text-center">Dashboard</h4>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button 
              className={`nav-link w-100 text-start ${activeTab === "profile" ? "active fw-bold" : "text-white"}`} 
              onClick={() => setActiveTab("profile")}
            >
              <i className="bi bi-person-circle me-2"></i>Profile
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link w-100 text-start ${activeTab === "security" ? "active fw-bold" : "text-white"}`} 
              onClick={() => setActiveTab("security")}
            >
              <i className="bi bi-shield-lock me-2"></i>Security Settings
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link w-100 text-start ${activeTab === "logs" ? "active fw-bold" : "text-white"}`} 
              onClick={() => setActiveTab("logs")}
            >
              <i className="bi bi-clock-history me-2"></i>Login History
            </button>
          </li>
          <li className="nav-item mt-auto">
            <button 
              className="nav-link text-danger w-100 text-start" 
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="container mt-4 w-75 mx-auto">
        <h2>Welcome, {user.username}</h2>
        <p className="text-muted">Role: {user.role}</p>

        {/* Profile Section */}
        {activeTab === "profile" && (
          <div className="card shadow p-4 w-75 mx-auto">
            <h5 className="text-center mb-4">Profile Information</h5>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" value={user.username} disabled />
                <small className="text-muted">Username cannot be changed</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={profile.email} 
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  value={profile.phone} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-success w-100">Update Profile</button>
            </form>
          </div>
        )}

        {/* Security Section */}
        {activeTab === "security" && (
          <div className="card shadow p-4">
            <h5 className="text-center mb-4">Security Settings</h5>
            <div className="mb-4">
              <h6>Password Management</h6>
              <p className="text-muted">Strong passwords help protect your account</p>
              <button className="btn btn-warning w-100 mb-4" data-bs-toggle="modal" data-bs-target="#passwordModal">
                <i className="bi bi-key me-2"></i>Update Password
              </button>
              
              <h6>Two-Factor Authentication</h6>
              <p className="text-muted">
                Add an extra layer of security to your account
              </p>
              <div className="d-flex align-items-center mb-3">
                <div className={`badge ${user.mfaEnabled ? 'bg-success' : 'bg-danger'} me-2`}>
                  {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                </div>
                <span>Multi-Factor Authentication</span>
              </div>
              <button 
                className={`btn ${user.mfaEnabled ? "btn-danger" : "btn-primary"} w-100`} 
                data-bs-toggle="modal" 
                data-bs-target="#mfaModal"
              >
                <i className={`bi ${user.mfaEnabled ? "bi-shield-slash" : "bi-shield-check"} me-2`}></i>
                {user.mfaEnabled ? "Disable MFA" : "Enable MFA"}
              </button>
            </div>
          </div>
        )}

        {/* Login History */}
        {activeTab === "logs" && (
          <div className="card shadow p-4">
            <h5 className="text-center mb-4">Login History & Account Activity</h5>
            {logs.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered mt-3">
                  <thead className="table-dark">
                    <tr>
                      <th>Type</th>
                      <th>Timestamp</th>
                      <th>IP Address</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className={getLogClass(log.type)}>
                        <td>{log.type}</td>
                        <td>{log.timestamp}</td>
                        <td><code>{log.ip}</code></td>
                        <td>{log.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-5">
                <i className="bi bi-clock-history fs-1 text-muted"></i>
                <p className="mt-3">No activity logs available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Update Modal */}
      <div className="modal fade" id="passwordModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Update Password</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePasswordChange}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    required 
                    value={passwords.currentPassword} 
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    required 
                    value={passwords.newPassword} 
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    required 
                    value={passwords.confirmPassword} 
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} 
                  />
                </div>
                <button type="submit" className="btn btn-success w-100">Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MFA Modal */}
      <div className="modal fade" id="mfaModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {user.mfaEnabled ? "Disable Two-Factor Authentication" : "Enable Two-Factor Authentication"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {user.mfaEnabled ? (
                <div className="text-center">
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Warning: Disabling MFA will reduce your account security
                  </div>
                  <p>Are you sure you want to disable two-factor authentication?</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    MFA adds an extra layer of security to your account
                  </div>
                  <p>You'll be required to enter a verification code when logging in</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button 
                type="button" 
                className={`btn ${user.mfaEnabled ? "btn-danger" : "btn-primary"}`} 
                onClick={toggleMFA}
              >
                {user.mfaEnabled ? "Disable MFA" : "Enable MFA"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;