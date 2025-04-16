import { useEffect, useState } from "react";
import { authService } from "../api/service";
import { Navigate, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", phone: "", role: "", mfa_enabled: false });
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  
  const navigate = useNavigate();

  // Initialize Bootstrap tooltips and popovers
  useEffect(() => {
    // Check if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
      // Initialize all tooltips
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
      
      // Initialize all dropdowns
      const dropdownTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
      dropdownTriggerList.map(function (dropdownTriggerEl) {
        return new bootstrap.Dropdown(dropdownTriggerEl);
      });
    }
  }, []);

  // Fetch all users and check authentication
  useEffect(() => {
    const fetchUsers = async () => {
      if (!authService.isAuthenticated()) {
        setRedirectToLogin(true);
        return;
      }
      
      try {
        setLoading(true);
        const response = await authService.getAllUsers();
        // Map API response to our component state
        setUsers(response.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          mfaEnabled: user.mfa_enabled 
        })));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please try again later.");
        if (err.response?.status === 401) {
          setRedirectToLogin(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle Role Change
  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
  };

  // Save Role Change
  const saveRoleChange = async () => {
    if (selectedUser && newRole) {
      try {
        // Pass object directly without JSON.stringify
        const res = await authService.assignUserRole({
          username: selectedUser.username, 
          role: newRole
        });
        
        if (res) { 
          // Update UI state
          setUsers(
            users.map((user) =>
              user.id === selectedUser.id ? { ...user, role: newRole } : user
            )
          );
        }
        setSelectedUser(null);
      } catch (err) {
        console.error("Failed to update role:", err);
        setError("Failed to update user role. Please try again.");
      }
    }
  };

  // Toggle MFA
  const toggleMFA = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    try {
      // Pass object directly without JSON.stringify
      const res = await authService.enableMFA({ username: user.username });
      
      if (res) {
        // Update UI state
        setUsers(
          users.map((u) =>
            u.id === id ? { ...u, mfaEnabled: !u.mfaEnabled } : u
          )
        );
      } else {
        alert(res?.message || "Error occurred updating user");
      } 
    } catch (err) {
      console.error("Failed to toggle MFA:", err);
      setError("Failed to update MFA settings. Please try again.");
    }
  };

  // Handle New User Input
  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({ 
      ...newUser, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Validate new user form
  const validateNewUser = () => {
    if (!newUser.username.trim()) return "Username is required";
    if (!newUser.email.trim()) return "Email is required";
    if (!newUser.password.trim() || newUser.password.length < 6) return "Password must be at least 6 characters";
    if (!newUser.role) return "Role is required";
    return null;
  };

  // Add New User
  const addUser = async () => {
    const validationError = validateNewUser();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try { 
      const apiUser = {
        ...newUser
      };
      
      // Fixed function name from createser to createUser
      const response = await authService.createser(apiUser);
      
      if (response && response.message === "User created successfully") {
        // Update UI with the new user 
        setUsers([...users, { 
          id: response.id || (users.length + 1), // Use returned ID if available
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          mfaEnabled: newUser.mfa_enabled
        }]);
        
        setShowAddUserModal(false);
        setNewUser({ username: "", email: "", password: "", phone: "", role: "", mfa_enabled: false });
        setError(null);
      } else {
        setError(response?.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Failed to create user:", err);
      setError("Failed to create user. Please try again.");
    }
  };

  // Modal backdrop click handler
  const handleBackdropClick = (e, closeAction) => {
    // Only close if the click was directly on the backdrop
    if (e.target === e.currentTarget) {
      closeAction();
    }
  };

  // Logout handler
  const handleLogout = () => {
    authService.logout();
    setRedirectToLogin(true);
  };

  // Get Role Badge
  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <span className="badge bg-danger rounded-pill px-3">Admin</span>;
      case "security":
        return <span className="badge bg-warning text-dark rounded-pill px-3">Security</span>;
      default:
        return <span className="badge bg-info text-white rounded-pill px-3">User</span>;
    }
  };

  // Redirect to login if not authenticated
  if (redirectToLogin) {
    return <Navigate to="/login" />;
  }

  const currentUser = authService.getCurrentUser();

  return (
    <div className="container-fluid p-0">
      {/* Sidebar and Main Content Layout */}
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-auto d-none d-lg-block bg-dark text-white" style={{ width: "250px", minHeight: "100vh" }}>
          <div className="d-flex flex-column p-3">
            <h3 className="fs-4 mb-4 text-center py-3 border-bottom border-secondary">
              <i className="bi bi-shield-lock me-2"></i>
              Admin Portal
            </h3>
            
            <ul className="nav nav-pills flex-column mb-auto">
              <li className="nav-item mb-2">
                <a href="#" className="nav-link active text-white">
                  <i className="bi bi-people me-2"></i>
                  User Management
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link text-white-50">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link text-white-50">
                  <i className="bi bi-shield me-2"></i>
                  Security
                </a>
              </li>
              <li className="nav-item mb-2">
                <a href="#" className="nav-link text-white-50">
                  <i className="bi bi-journal-text me-2"></i>
                  Audit Logs
                </a>
              </li>
              <li className="nav-item mb-2">
                <a 
                  href="#" 
                  className="nav-link text-white-50"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <i className="bi bi-lock me-2"></i>
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="col">
          {/* Top Navigation */}
          <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
            <div className="container-fluid">
              <button 
                className="navbar-toggler d-lg-none" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#sidebarMenu"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="d-flex align-items-center">
                <span className="fs-5 d-lg-none">Admin Portal</span>
              </div>
              
              <div className="ms-auto">
                <div className="dropdown">
                  <a 
                    href="#" 
                    className="d-flex align-items-center text-decoration-none dropdown-toggle" 
                    id="dropdownUser" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "32px", height: "32px" }}>
                      {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <span>{currentUser?.username || 'Admin'}</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser">
                    <li><a className="dropdown-item" href="#">Profile</a></li>
                    <li><a className="dropdown-item" href="#">Settings</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a 
                        className="dropdown-item" 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                      >
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>

          {/* Dashboard Content */}
          <div className="p-4 bg-light" style={{ minHeight: "calc(100vh - 56px)" }}>
            <div className="row mb-4">
              <div className="col">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="mb-1">User Management</h4>
                    <p className="text-muted mb-0">Manage user roles and security settings</p>
                  </div>
                  <button 
                    className="btn btn-primary d-flex align-items-center" 
                    onClick={() => {
                      setError(null);
                      setShowAddUserModal(true);
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Add User
                  </button>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger mb-4 alert-dismissible fade show">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError(null)}
                  aria-label="Close"
                ></button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading users...</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="row mb-4">
                  <div className="col-md-4 mb-3 mb-md-0">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="text-muted mb-1">Total Users</h6>
                            <h3 className="mb-0">{users.length}</h3>
                          </div>
                          <div className="bg-light rounded-circle p-3">
                            <i className="bi bi-people fs-4 text-primary"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3 mb-md-0">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="text-muted mb-1">Admin Users</h6>
                            <h3 className="mb-0">
                              {users.filter(user => user.role === "admin").length}
                            </h3>
                          </div>
                          <div className="bg-light rounded-circle p-3">
                            <i className="bi bi-person-fill-gear fs-4 text-danger"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="text-muted mb-1">MFA Enabled</h6>
                            <h3 className="mb-0">
                              {users.filter(user => user.mfaEnabled).length}
                            </h3>
                          </div>
                          <div className="bg-light rounded-circle p-3">
                            <i className="bi bi-shield-check fs-4 text-success"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Table Card */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="border-0 ps-4 py-3">User</th>
                            <th className="border-0 py-3">Role</th>
                            <th className="border-0 py-3">MFA Status</th>
                            <th className="border-0 text-end pe-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length > 0 ? (
                            users.map((user) => (
                              <tr key={user.id}>
                                <td className="ps-4">
                                  <div className="d-flex align-items-center">
                                    <div 
                                      className="rounded-circle text-white bg-primary d-flex align-items-center justify-content-center flex-shrink-0 me-3" 
                                      style={{width: "45px", height: "45px"}}
                                    >
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="fw-bold mb-0">{user.username}</p>
                                      <small className="text-muted">{user.email}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>{getRoleBadge(user.role)}</td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input 
                                      className="form-check-input" 
                                      type="checkbox" 
                                      checked={user.mfaEnabled} 
                                      onChange={() => toggleMFA(user.id)}
                                      id={`mfa-switch-${user.id}`}
                                    />
                                    <label className="form-check-label small" htmlFor={`mfa-switch-${user.id}`}>
                                      {user.mfaEnabled ? 
                                        <span className="text-success">Enabled</span> : 
                                        <span className="text-muted">Disabled</span>
                                      }
                                    </label>
                                  </div>
                                </td>
                                <td className="text-end pe-4">
                                  <button 
                                    className="btn btn-sm btn-outline-primary" 
                                    onClick={() => handleRoleChange(user)}
                                  >
                                    <i className="bi bi-pencil-square me-1"></i>
                                    Change Role
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center py-4 text-muted">
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div 
          className="modal fade show" 
          style={{display: "block", backgroundColor: "rgba(0,0,0,0.5)"}} 
          tabIndex="-1"
          onClick={(e) => handleBackdropClick(e, () => setSelectedUser(null))}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Change Role for {selectedUser.username}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedUser(null)}></button>
              </div>
              <div className="modal-body py-4">
                <select 
                  className="form-select" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="user">Normal User</option>
                  <option value="security">Security Team</option>
                </select>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setSelectedUser(null)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary px-4" 
                  onClick={saveRoleChange} 
                  disabled={!newRole}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div 
          className="modal fade show" 
          style={{display: "block", backgroundColor: "rgba(0,0,0,0.5)"}} 
          tabIndex="-1"
          onClick={(e) => handleBackdropClick(e, () => setShowAddUserModal(false))}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Add New User</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddUserModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Username <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-person"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="username" 
                      value={newUser.username} 
                      onChange={handleNewUserChange} 
                      placeholder="Enter username"
                      required 
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email" 
                      value={newUser.email} 
                      onChange={handleNewUserChange} 
                      placeholder="Enter email"
                      required 
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-phone"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="phone" 
                      value={newUser.phone} 
                      onChange={handleNewUserChange} 
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input 
                      type="password" 
                      className="form-control" 
                      name="password" 
                      value={newUser.password} 
                      onChange={handleNewUserChange} 
                      placeholder="Enter password (min 6 characters)"
                      required 
                    />
                  </div>
                  {newUser.password && newUser.password.length < 6 && (
                    <small className="text-danger">Password must be at least 6 characters</small>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Role <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-shield"></i>
                    </span>
                    <select 
                      className="form-select" 
                      name="role" 
                      value={newUser.role} 
                      onChange={handleNewUserChange} 
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="user">Normal User</option>
                      <option value="security">Security Team</option>
                    </select>
                  </div>
                </div>
                <div className="form-check form-switch mt-4">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    name="mfa_enabled"
                    id="mfa" 
                    checked={newUser.mfa_enabled} 
                    onChange={handleNewUserChange} 
                  />
                  <label className="form-check-label" htmlFor="mfa">
                    Enable Two-Factor Authentication
                  </label>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  className="btn btn-light" 
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary px-4" 
                  onClick={addUser}
                  disabled={!newUser.username || !newUser.email || !newUser.password || !newUser.role}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;