import { useState, useEffect } from 'react';
import { getDashboardStats, getUsers } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    tickets: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await getDashboardStats();
      const usersResponse = await getUsers();
      setStats(statsResponse.data || stats);
      setRecentUsers(usersResponse.data?.slice(0, 5) || []);
    } catch (_err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="container-fluid px-3 px-lg-4 py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="dashboard-content">
      <div className="container-fluid px-3 px-lg-4 py-4">
        <AlertBox type="error" message={error} />
        <div className="page-heading">
          <div className="page-heading-copy">
            <span className="page-icon"><i className="bi bi-speedometer2" aria-hidden="true"></i></span>
            <div>
              <p className="eyebrow mb-1">Overview</p>
              <h1 className="h3 mb-1">Dashboard</h1>
              <p className="text-muted mb-0">Monitor performance, sales, users, and support from one clean workspace.</p>
            </div>
          </div>
          <div className="heading-actions"><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-download" aria-hidden="true"></i> Export</button><button className="btn btn-primary btn-sm" type="button"><i className="bi bi-file-earmark-plus" aria-hidden="true"></i> Create Report</button></div>
        </div>

        <section className="row g-3 mt-1" aria-label="Dashboard metrics">
          <div className="col-12 col-sm-6 col-xl-3">
            <article className="metric-card metric-primary">
              <div className="metric-top">
                <span className="metric-label">Revenue</span>
                <span className="metric-icon"><i className="bi bi-currency-dollar" aria-hidden="true"></i></span>
              </div>
              <div className="metric-value">${stats.revenue?.toLocaleString() || '0'}</div>
              <div className="metric-meta">
                <span className="text-success">+12.5%</span>
                <span>from last month</span>
              </div>
            </article>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <article className="metric-card metric-success">
              <div className="metric-top">
                <span className="metric-label">Orders</span>
                <span className="metric-icon"><i className="bi bi-bag-check" aria-hidden="true"></i></span>
              </div>
              <div className="metric-value">{stats.orders?.toLocaleString() || '0'}</div>
              <div className="metric-meta">
                <span className="text-success">+8.2%</span>
                <span>new orders</span>
              </div>
            </article>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <article className="metric-card metric-warning">
              <div className="metric-top">
                <span className="metric-label">Customers</span>
                <span className="metric-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
              </div>
              <div className="metric-value">{stats.customers?.toLocaleString() || '0'}</div>
              <div className="metric-meta">
                <span className="text-success">+5.1%</span>
                <span>active users</span>
              </div>
            </article>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <article className="metric-card metric-danger">
              <div className="metric-top">
                <span className="metric-label">Tickets</span>
                <span className="metric-icon"><i className="bi bi-life-preserver" aria-hidden="true"></i></span>
              </div>
              <div className="metric-value">{stats.tickets || '0'}</div>
              <div className="metric-meta">
                <span className="text-danger">3 urgent</span>
                <span>need review</span>
              </div>
            </article>
          </div>
        </section>

        <section className="row g-3 mt-1">
          <div className="col-12 col-xl-8">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title"><i className="bi bi-graph-up-arrow" aria-hidden="true"></i><span>Sales Performance</span></h2>
                  <p className="text-muted mb-0">Monthly revenue compared with operational targets.</p>
                </div>
                <a className="btn btn-light btn-sm" href="charts.html">View Details</a>
              </div>

              <div className="chart-bars" aria-label="Sales performance chart">
                <div className="chart-column bar-42"><span></span><small>Jan</small></div>
                <div className="chart-column bar-58"><span></span><small>Feb</small></div>
                <div className="chart-column bar-51"><span></span><small>Mar</small></div>
                <div className="chart-column bar-72"><span></span><small>Apr</small></div>
                <div className="chart-column bar-66"><span></span><small>May</small></div>
                <div className="chart-column bar-83"><span></span><small>Jun</small></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="panel h-100">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title"><i className="bi bi-activity" aria-hidden="true"></i><span>Team Activity</span></h2>
                  <p className="text-muted mb-0">Recent operational updates.</p>
                </div>
              </div>

              <div className="activity-list">
                <div className="activity-item"><span className="activity-dot bg-primary"></span><div><p className="mb-1 fw-semibold">New campaign launched</p><p className="text-muted small mb-0">Marketing team published the May offer.</p></div></div>
                <div className="activity-item"><span className="activity-dot bg-success"></span><div><p className="mb-1 fw-semibold">Payment batch cleared</p><p className="text-muted small mb-0">246 invoices were processed successfully.</p></div></div>
                <div className="activity-item"><span className="activity-dot bg-warning"></span><div><p className="mb-1 fw-semibold">Support queue rising</p><p className="text-muted small mb-0">Average first response time is 18 minutes.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel mt-3">
          <div className="panel-header">
            <div>
              <h2 className="h5 mb-1 section-title"><i className="bi bi-people" aria-hidden="true"></i><span>Recent Users</span></h2>
              <p className="text-muted mb-0">Latest account activity across the workspace.</p>
            </div>
            <a className="btn btn-outline-secondary btn-sm" href="users.html">Manage Users</a>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Team</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col" className="text-end">Action</th></tr></thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img className="avatar-img avatar-sm" src={`../assets/images/avatar/avatar-${user.id % 5 + 1}.jpg`} alt={`${user.firstName} ${user.lastName}`} />
                        <div>
                          <p className="fw-semibold mb-0">{user.firstName} {user.lastName}</p>
                          <p className="text-muted small mb-0">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{user.role || 'User'}</td>
                    <td>{user.school || 'N/A'}</td>
                    <td><span className={`badge text-bg-${user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'secondary'}`}>{user.status || 'Active'}</span></td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="text-end"><a className="btn btn-light btn-sm" href={`user-details.html?id=${user.id}`}>View</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;