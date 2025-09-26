import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const API = `${BACKEND_URL}/api`;

// Header component
const Header = ({ stats }) => {
  return (
    <header className="bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            FANTA-VENGERS 2025-2026
          </h1>
          <p className="text-lg text-gray-600 font-medium">Dashboard Gestione Lega</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_teams || 0}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Squadre Attive</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_prizes || 0}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Premi Assegnati</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">€{stats?.total_winnings || 0}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Vincite Totali</div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Team card component with professional business design
const TeamCard = ({ team, onEdit, isAdmin }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
            <p className="text-sm text-gray-600 font-medium">{team.owner}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => onEdit(team)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Modifica
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800 mb-1">{team.weekly_prizes}</div>
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Premi</div>
          </div>
          <div className="text-center bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-800 mb-1">{team.remaining_changes}</div>
            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Cambi</div>
          </div>
        </div>
        
        <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-2xl font-bold text-green-700 mb-1">€{team.total_winnings}</div>
          <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Vincite Totali</div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 px-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <span className="text-sm font-medium text-indigo-700 uppercase tracking-wide">Crediti</span>
            <span className="text-lg font-semibold text-indigo-800">{team.remaining_credits}</span>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">Giocatori Non Schierabili</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 min-h-[4rem]">
              {team.non_callable_players || "Nessun giocatore"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Leaderboard component
const Leaderboard = ({ teams }) => {
  const sortedTeams = [...teams].sort((a, b) => b.total_winnings - a.total_winnings);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Classifica Prestazioni</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Posizione</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Squadra</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Premi</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Vincite Totali</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTeams.map((team, index) => (
              <tr key={team.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                      index === 1 ? 'bg-gray-100 text-gray-700' : 
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600'}`}>
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-600">{team.owner}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-medium text-gray-900">{team.weekly_prizes}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-semibold text-green-700">€{team.total_winnings}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-center">
        <span className="text-sm font-medium text-gray-900">
          Totale Vincite Lega: €{sortedTeams.reduce((sum, team) => sum + team.total_winnings, 0)}
        </span>
      </div>
    </div>
  );
};

// Admin login component
const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/admin/auth`, { password });
      onLogin(response.data.token);
      setError("");
    } catch (err) {
      setError("Password non valida");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Accesso Amministrativo</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci password amministrativa"
            />
          </div>
          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => onLogin(null)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit team modal
const EditTeamModal = ({ team, onSave, onClose, token }) => {
  const [formData, setFormData] = useState({
    remaining_credits: team?.remaining_credits || 0,
    remaining_changes: team?.remaining_changes || 0,
    weekly_prizes: team?.weekly_prizes || 0,
    total_winnings: team?.total_winnings || 0,
    non_callable_players: team?.non_callable_players || ""
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API}/admin/teams/${team.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSave();
    } catch (err) {
      console.error("Error updating team:", err);
    }
  };
  
  if (!team) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Modifica Squadra: {team.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crediti Rimanenti
              </label>
              <input
                type="number"
                value={formData.remaining_credits}
                onChange={(e) => setFormData({...formData, remaining_credits: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cambi Rimanenti
              </label>
              <input
                type="number"
                value={formData.remaining_changes}
                onChange={(e) => setFormData({...formData, remaining_changes: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Premi Giornata
              </label>
              <input
                type="number"
                value={formData.weekly_prizes}
                onChange={(e) => setFormData({...formData, weekly_prizes: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vincite Totali (€)
              </label>
              <input
                type="number"
                value={formData.total_winnings}
                onChange={(e) => setFormData({...formData, total_winnings: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giocatori Non Schierabili
            </label>
            <textarea
              value={formData.non_callable_players}
              onChange={(e) => setFormData({...formData, non_callable_players: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Lista giocatori non richiamabili..."
            />
          </div>
          
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Salva Modifiche
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App component
function App() {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const fetchData = async () => {
    try {
      const [teamsResponse, statsResponse] = await Promise.all([
        axios.get(`${API}/teams`),
        axios.get(`${API}/stats`)
      ]);
      setTeams(teamsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdminLogin = (token) => {
    if (token) {
      setAdminToken(token);
      setIsAdmin(true);
    }
    setShowAdminLogin(false);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
  };

  const handleSaveTeam = async () => {
    setEditingTeam(null);
    await fetchData(); // Refresh data
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAdminToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header stats={stats} />
      
      {/* Admin controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Console di Gestione</h2>
            <p className="text-gray-600">Amministrazione Lega Fantacalcio</p>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Accesso Admin Attivo</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Esci
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Accesso Admin
              </button>
            )}
          </div>
        </div>

        {/* Teams grid - Professional Cards */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Panoramica Squadre</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard teams={teams} />
      </div>

      {/* Modals */}
      {showAdminLogin && <AdminLogin onLogin={handleAdminLogin} />}
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onSave={handleSaveTeam}
          onClose={() => setEditingTeam(null)}
          token={adminToken}
        />
      )}
    </div>
  );
}

export default App;

