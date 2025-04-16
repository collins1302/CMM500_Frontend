import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom"; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { authService } from "../api/service";

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {

    const fetchLogs = async () => {
           // Get current user
     const currentUser = authService.getCurrentUser();
     if (!currentUser && !currentUser.username) return ; 
    setLoggedInUser(currentUser.username);
      try {
        const logResponse = await authService.getLogs(); 
        const transformedLogs = logResponse.map(log => ({
          id: log.id,
          type: log.event_type,
          user: log.username,
          ip: log.ip_address,
          timestamp: formatTimestamp(log.timestamp),
          action: log.description || "-",
          user_id: log.user_id
        }));
        setLogs(transformedLogs);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs();
    
   
  }, [loggedInUser]);



  // Format timestamp from ISO to more readable format
  const formatTimestamp = (isoTimestamp) => {
    try {
      const date = new Date(isoTimestamp);
      return date.toLocaleString();
    } catch (e) {
      return isoTimestamp;
    }
  };

  // Function to generate a random IP address for testing
  const generateRandomIP = () => {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  };

  // Simulate adding a new log entry dynamically
  const addLog = () => {
    const eventTypes = ["LOGIN_SUCCESS", "FAILED_LOGIN", "ROLE_CHANGED", "UNAUTHORIZED_ACCESS", "SUSPICIOUS_ACTIVITY", "USER_CREATED", "MFA_ENABLED"];
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const newLog = {
      id: logs.length > 0 ? Math.max(...logs.map(log => log.id)) + 1 : 1,
      type: randomEvent,
      user: "random_user",
      ip: generateRandomIP(),
      timestamp: new Date().toLocaleString(),
      action: "Simulated event",
      user_id: 999
    };

    setLogs([...logs, newLog]);
  };

  // Export logs as CSV
  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Type,User,IP,Action,Timestamp", ...logs.map(log => `${log.type},${log.user},${log.ip},${log.action || ""},${log.timestamp}`)]
      .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "security_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process logs for the graph
  const eventCounts = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(eventCounts).map(eventType => ({
    name: eventType,
    count: eventCounts[eventType],
  }));

  // Logout function
  const handleLogout = () => {
     authService.logout();
    setLoggedInUser("");
    navigate("/login");
  };

  // Get alert status badge
  const getStatusBadge = (type) => {
    switch (type) {
      case "SUSPICIOUS_ACTIVITY":
      case "UNAUTHORIZED_ACCESS":
        return <span className="badge bg-danger">Critical</span>;
      case "FAILED_LOGIN":
        return <span className="badge bg-warning text-dark">Warning</span>;
      case "ROLE_CHANGED":
      case "USER_CREATED":
      case "MFA_ENABLED":
        return <span className="badge bg-info">Info</span>;
      default:
        return <span className="badge bg-success">Normal</span>;
    }
  };

  // Determine log severity level
  const getSeverityClass = (type) => {
    switch (type) {
      case "SUSPICIOUS_ACTIVITY":
      case "UNAUTHORIZED_ACCESS":
        return "table-danger";
      case "FAILED_LOGIN":
        return "table-warning";
      default:
        return "";
    }
  };

  // Count incidents by severity
  const criticalCount = logs.filter(log => 
    log.type === "SUSPICIOUS_ACTIVITY" || log.type === "UNAUTHORIZED_ACCESS"
  ).length;
  
  const warningCount = logs.filter(log => 
    log.type === "FAILED_LOGIN"
  ).length;
  
  const infoCount = logs.filter(log => 
    log.type === "ROLE_CHANGED" || log.type === "USER_CREATED" || log.type === "MFA_ENABLED"
  ).length;
  
  const normalCount = logs.filter(log => 
    log.type === "LOGIN_SUCCESS"
  ).length;

  if ( !loggedInUser || loggedInUser == "") <Navigate to="/login" />

  return (
    <div className="container-fluid bg-light" style={{minHeight: "100vh"}}>
      {/* Top navigation bar */}
      <nav className="navbar navbar-dark bg-primary mb-4 px-3">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">Security Operations Center</a>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <i className="bi bi-person-badge me-1"></i>
              {loggedInUser}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Status summary cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-left-danger h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">Critical Alerts</div>
                    <div className="h5 mb-0 font-weight-bold">{criticalCount}</div>
                  </div>
                  <div className="col-auto">
                    <i className="bi bi-exclamation-triangle-fill text-danger fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-left-warning h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Warnings</div>
                    <div className="h5 mb-0 font-weight-bold">{warningCount}</div>
                  </div>
                  <div className="col-auto">
                    <i className="bi bi-exclamation-circle-fill text-warning fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-left-info h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Information</div>
                    <div className="h5 mb-0 font-weight-bold">{infoCount}</div>
                  </div>
                  <div className="col-auto">
                    <i className="bi bi-info-circle-fill text-info fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-left-success h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Normal Events</div>
                    <div className="h5 mb-0 font-weight-bold">{normalCount}</div>
                  </div>
                  <div className="col-auto">
                    <i className="bi bi-check-circle-fill text-success fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          {/* Graph Section */}
          <div className="col-xl-8 col-lg-7">
            <div className="card shadow mb-4">
              <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                <h6 className="m-0 font-weight-bold text-primary">Security Event Summary</h6>
                <div className="dropdown no-arrow">
                  <button className="btn btn-link btn-sm" type="button">
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 70 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#4e73df" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="col-xl-4 col-lg-5">
            <div className="card shadow mb-4">
              <div className="card-header py-3 bg-white">
                <h6 className="m-0 font-weight-bold text-primary">Alert Notifications</h6>
              </div>
              <div className="card-body">
                <div className="list-group">
                  {logs.filter(log => log.type === "SUSPICIOUS_ACTIVITY" || log.type === "UNAUTHORIZED_ACCESS")
                    .slice(0, 4).map((log) => (
                    <div key={log.id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{log.type}</h6>
                        <small>{log.timestamp}</small>
                      </div>
                      <p className="mb-1">User: {log.user}</p>
                      <small className="text-muted">IP: {log.ip}</small>
                    </div>
                  ))}
                  {logs.filter(log => log.type === "SUSPICIOUS_ACTIVITY" || log.type === "UNAUTHORIZED_ACCESS").length === 0 && (
                    <div className="text-center p-3 text-muted">
                      No critical alerts at this time
                    </div>
                  )}
                </div>
                <div className="text-center mt-3">
                  <button className="btn btn-primary btn-sm" onClick={addLog}>
                    <i className="bi bi-bell me-1"></i>
                    Simulate Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Section */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow mb-4">
              <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                <h6 className="m-0 font-weight-bold text-primary">Security Audit Log</h6>
                <button className="btn btn-sm btn-outline-primary" onClick={exportLogs}>
                  <i className="bi bi-download me-1"></i>
                  Export Logs
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover" width="100%" cellSpacing="0">
                    <thead className="table-light">
                      <tr>
                        <th>Status</th>
                        <th>Type</th>
                        <th>User</th>
                        <th>IP Address</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className={getSeverityClass(log.type)}>
                          <td>{getStatusBadge(log.type)}</td>
                          <td>{log.type}</td>
                          <td>{log.user}</td>
                          <td><code>{log.ip}</code></td>
                          <td>{log.action || "-"}</td>
                          <td>{log.timestamp}</td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center">Loading logs...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="sticky-footer bg-white">
        <div className="container my-auto">
          <div className="copyright text-center my-auto">
            <span>Security Operations Dashboard &copy; 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SecurityDashboard;