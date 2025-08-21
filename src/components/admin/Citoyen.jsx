import axios from "axios"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

export default function Citoyen() {
  const [listecitoyen, setlistecitoyen] = useState([])
  const [filtre, setFiltre] = useState("toutes")
  const [selectedCitoyen, setSelectedCitoyen] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCitoyens = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        const headers = { Authorization: `Bearer ${token}` }
        const res = await axios.get("http://127.0.0.1:8000/api/citoyenuser/", { headers })
        
        if (res.status === 200) {
          setlistecitoyen(res.data)
          toast.success("Liste des citoyens chargée avec succès")
        }
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors du chargement des citoyens")
      } finally {
        setLoading(false)
      }
    }

    fetchCitoyens()
  }, [])

  const citoyenfiltres = listecitoyen.filter(citoyen => {
    const matchesFilter = 
      filtre === "attente" ? !citoyen.user.is_active :
      filtre === "valide" ? citoyen.user.is_active :
      true
    
    const matchesSearch = searchTerm === "" || 
      citoyen.nom.toLowerCase().includes(searchTerm) || 
      citoyen.prenom.toLowerCase().includes(searchTerm)
    
    return matchesFilter && matchesSearch
  })

  const activeroudesactivercompte = async (idcit) => {
    try {
      const token = localStorage.getItem("accessToken")
      const headers = { Authorization: `Bearer ${token}` }
      
      toast.promise(
        axios.get(`http://127.0.0.1:8000/api/activer-ou-desactiver-citoyen/${idcit}`, { headers }),
        {
          loading: 'Traitement en cours...',
          success: (res) => {
            if (res.status === 200) {
              setlistecitoyen(prev => prev.map(c => 
                c.id === idcit ? { ...c, user: { ...c.user, is_active: !c.user.is_active } } : c
              ))
              return `Compte ${res.data.is_active ? 'activé' : 'désactivé'} avec succès`
            }
            return 'Opération réussie'
          },
          error: 'Erreur lors de la modification du statut'
        }
      )
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue")
    }
  }

  const showCitoyenDetails = (citoyen) => {
    setSelectedCitoyen(citoyen)
    toast.success(`Détails de ${citoyen.nom} ${citoyen.prenom}`, {
      icon: '👤',
    })
  }

  const closeDetails = () => {
    setSelectedCitoyen(null)
  }

  return (
    <div className="citoyen-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Modal de détails */}
      {selectedCitoyen && (
        <div className="citoyen-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Détails du citoyen</h2>
              <button onClick={closeDetails} className="close-button">
                ×
              </button>
            </div>
            
            <div className="detail-item">
              <p className="detail-label">Nom complet</p>
              <p className="detail-value">
                {selectedCitoyen.nom} {selectedCitoyen.prenom}
              </p>
            </div>
            
            <div className="detail-item">
              <p className="detail-label">Email</p>
              <p className="detail-value">{selectedCitoyen.user.email}</p>
            </div>
            
            <div className="detail-item">
              <p className="detail-label">Bio</p>
              <p className="detail-value">{selectedCitoyen.bio || 'Non renseigné'}</p>
            </div>
            
            <div className="detail-item">
              <p className="detail-label">Expérience</p>
              <p className="detail-value">{selectedCitoyen.experiences || 'Non renseigné'}</p>
            </div>
            
            <div className="detail-item">
              <p className="detail-label">Statut</p>
              <span className={`status-badge ${selectedCitoyen.user.is_active ? 'active' : 'inactive'}`}>
                {selectedCitoyen.user.is_active ? "Validé" : "En attente"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="header-section">
        <div>
          <h1>Liste des Citoyens</h1>
          <p>Gérez et validez les citoyens de la plateforme</p>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
          <svg className="search-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filtre === "attente" ? 'active' : ''}`}
          onClick={() => setFiltre("attente")}
        >
          En attente ({listecitoyen.filter(c => !c.user.is_active).length})
        </button>
        <button
          className={`filter-btn ${filtre === "valide" ? 'active' : ''}`}
          onClick={() => setFiltre("valide")}
        >
          Validés ({listecitoyen.filter(c => c.user.is_active).length})
        </button>
        <button
          className={`filter-btn ${filtre === "toutes" ? 'active' : ''}`}
          onClick={() => setFiltre("toutes")}
        >
          Tous ({listecitoyen.length})
        </button>
      </div>

      {/* Tableau */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Chargement...</div>
        ) : citoyenfiltres.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Bio</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {citoyenfiltres.map((citoyen, index) => (
                <tr key={index}>
                  <td>{citoyen.nom} {citoyen.prenom}</td>
                  <td className="email-cell">{citoyen.user.email}</td>
                  <td>{citoyen.bio ? `${citoyen.bio.substring(0, 50)}${citoyen.bio.length > 50 ? '...' : ''}` : 'Non renseigné'}</td>
                  <td>
                    <span className={`status-badge ${citoyen.user.is_active ? 'active' : 'inactive'}`}>
                      {citoyen.user.is_active ? "Validé" : "En attente"}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => showCitoyenDetails(citoyen)}
                      title="Voir les détails"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      className={`toggle-btn ${citoyen.user.is_active ? 'deactivate' : 'activate'}`}
                      onClick={() => activeroudesactivercompte(citoyen.id)}
                    >
                      {citoyen.user.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results">Aucun citoyen trouvé</div>
        )}
      </div>

      <style jsx>{`
        .citoyen-container {
          max-width: 90%;
          margin: 0 auto;
          padding: 32px 24px;
          background-color: #f9fafb;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .header-section h1 {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .header-section p {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .search-container {
          position: relative;
          width: 400px;
        }

        .search-container input {
          width: 100%;
          padding: 12px 16px 12px 40px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background-color: white;
          font-size: 14px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          outline: none;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 20px;
          height: 20px;
        }

        .filter-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .filter-btn {
          padding: 8px 16px;
          border-radius: 8px;
          background-color: transparent;
          color: #6b7280;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background-color: #6366f1;
          color: white;
        }

        .table-container {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        th {
          padding: 16px 24px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          padding: 16px 24px;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .email-cell {
          color: #6366f1;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background-color: #fef3c7;
          color: #92400e;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .view-btn {
          padding: 8px;
          border-radius: 8px;
          background-color: transparent;
          color: #6b7280;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background-color: #f3f4f6;
        }

        .view-btn svg {
          width: 20px;
          height: 20px;
        }

        .toggle-btn {
          padding: 8px 16px;
          border-radius: 8px;
          color: white;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .toggle-btn.activate {
          background-color: #10b981;
        }

        .toggle-btn.activate:hover {
          background-color: #059669;
        }

        .toggle-btn.deactivate {
          background-color: #ef4444;
        }

        .toggle-btn.deactivate:hover {
          background-color: #dc2626;
        }

        .loading-spinner, .no-results {
          padding: 32px;
          text-align: center;
          color: #6b7280;
        }

        /* Modal Styles */
        .citoyen-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          border-radius: 12px;
          padding: 24px;
          width: 500px;
          max-width: 90%;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #6b7280;
        }

        .detail-item {
          margin-bottom: 16px;
        }

        .detail-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 16px;
          color: #111827;
        }
      `}</style>
    </div>
  )
}