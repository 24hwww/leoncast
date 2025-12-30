import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Activity, Play, Square, Trash2 } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const [channels, setChannels] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newChannel, setNewChannel] = useState({ name: '', input_url: '', output_url: '', config: { loop: false } });

    const fetchChannels = async () => {
        try {
            const res = await api.get('/channels');
            setChannels(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchChannels();
        const interval = setInterval(fetchChannels, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/channels', newChannel);
            setShowCreate(false);
            setNewChannel({ name: '', input_url: '', output_url: '', config: { loop: false } });
            fetchChannels();
        } catch (err) {
            alert('Failed to create channel');
        }
    };

    const toggleStream = async (id, status) => {
        try {
            if (status === 'running') {
                await api.post(`/channels/${id}/stop`);
            } else {
                await api.post(`/channels/${id}/start`);
            }
            fetchChannels();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteChannel = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/channels/${id}`);
            fetchChannels();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="dashboard-page">
            <nav className="nav">
                <a href="#" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity /> LeonCast
                </a>
                <button className="btn" onClick={() => setShowCreate(!showCreate)}>
                    <Plus size={18} /> New Channel
                </button>
            </nav>

            <div className="container">
                {showCreate && (
                    <div className="card create-form">
                        <h2>Create New Channel</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-row">
                                <input
                                    placeholder="Channel Name"
                                    value={newChannel.name}
                                    onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                                    required
                                    style={{ flex: 1 }}
                                />
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newChannel.config.loop}
                                        onChange={e => setNewChannel({ ...newChannel, config: { ...newChannel.config, loop: e.target.checked } })}
                                    />
                                    <span>Loop Input</span>
                                </label>
                            </div>
                            <input
                                placeholder="Input URL (RTMP, HLS, or File path)"
                                value={newChannel.input_url}
                                onChange={e => setNewChannel({ ...newChannel, input_url: e.target.value })}
                                required
                                className="full-width"
                            />
                            <input
                                placeholder="Output URL (RTMP Destination)"
                                value={newChannel.output_url}
                                onChange={e => setNewChannel({ ...newChannel, output_url: e.target.value })}
                                className="full-width"
                            />
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn">Create Channel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="channels-grid">
                    {channels.map(channel => (
                        <div key={channel.id} className="card channel-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="channel-name">{channel.name}</h3>
                                    <div className="channel-sub" title={channel.input_url}>
                                        In: {channel.input_url}
                                    </div>
                                </div>
                                <div className={`status-badge status-${channel.status?.state || 'idle'}`}>
                                    {channel.status?.state || 'IDLE'}
                                </div>
                            </div>

                            <div className="preview-placeholder">
                                <span>No Preview</span>
                            </div>

                            <div className="card-actions">
                                <button
                                    onClick={() => toggleStream(channel.id, channel.status?.state)}
                                    className={`btn flex-1 action-btn ${channel.status?.state === 'running' ? 'btn-danger' : ''}`}
                                >
                                    {channel.status?.state === 'running' ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
                                </button>
                                <button
                                    onClick={() => deleteChannel(channel.id)}
                                    className="btn btn-secondary delete-btn"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {channel.status?.error && (
                                <div className="error-msg">
                                    {channel.status.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {channels.length === 0 && !showCreate && (
                    <div className="empty-state">
                        <Activity size={48} />
                        <p>No active channels. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
