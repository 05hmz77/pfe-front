import axios from "axios"
import { useEffect, useState } from "react"

export default function Association() {
  const [listeassociations, setlisteassociations] = useState([])
  const [filtre, setFiltre] = useState("toutes")
  const [selectedAssociation, setSelectedAssociation] = useState(null)

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/association-with-users/")
      .then((res) => {
        if (res.status === 200) {
          setlisteassociations(res.data)
        }
      }).catch((error) => {
        console.log(error)
      })
  }, [])

  const [nomassociation, setnomassociation] = useState("")

  const associationsFiltrees = listeassociations.filter(a => {
    if (filtre === "attente") return a.user.is_active === false
    if (filtre === "valide") return a.user.is_active === true
    return true
  })

  const activeroudesactivercompte = (idass) => {
    axios.get("http://127.0.0.1:8000/api/activer-ou-desactiver-Association/" + idass).then((res) => {
      if (res.status === 200) {
        window.location.reload()
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  const showAssociationDetails = (association) => {
    setSelectedAssociation(association)
  }

  const closeDetails = () => {
    setSelectedAssociation(null)
  }

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      maxWidth: '90%',
      margin: '0 auto',
      padding: '32px 24px',
      backgroundColor: '#f9fafb',
      borderRadius: '23px',
      height: '100%'
    }}>
      {/* Modal pour afficher les détails */}
      {selectedAssociation && (
        <div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  borderRadius: 23
}}
>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Détails de l'association
              </h2>
              <button 
                onClick={closeDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Nom</p>
              <p style={{ fontSize: '16px', color: '#111827' }}>{selectedAssociation.nom}</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Description</p>
              <p style={{ fontSize: '16px', color: '#111827' }}>{selectedAssociation.description}</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '16px', color: '#6366f1' }}>{selectedAssociation.user.email}</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Statut</p>
              <span style={{
                backgroundColor: selectedAssociation.user.is_active ? '#dcfce7' : '#fef3c7',
                color: selectedAssociation.user.is_active ? '#166534' : '#92400e',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {selectedAssociation.user.is_active ? "Validée" : "En attente"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Liste des Associations
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Gérez et validez les associations de la plateforme
          </p>
        </div>
        <div style={{ position: 'relative', width: '400px' }}>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              fontSize: '14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              outline: 'none'
            }}
            onChange={(e) => { setnomassociation(e.target.value) }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              width: '20px',
              height: '20px'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: filtre === "attente" ? '#6366f1' : 'transparent',
            color: filtre === "attente" ? 'white' : '#6b7280',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onClick={() => setFiltre("attente")}
        >
          En attente ({listeassociations.filter((a) => a.user.is_active === false).length})
        </button>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: filtre === "valide" ? '#6366f1' : 'transparent',
            color: filtre === "valide" ? 'white' : '#6b7280',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onClick={() => setFiltre("valide")}
        >
          Validées ({listeassociations.filter((a) => a.user.is_active === true).length})
        </button>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: filtre === "toutes" ? '#6366f1' : 'transparent',
            color: filtre === "toutes" ? 'white' : '#6b7280',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onClick={() => setFiltre("toutes")}
        >
          Toutes ({listeassociations.length})
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Association</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Description</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Email</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Statut</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {associationsFiltrees.filter((i) => {
              return nomassociation.toLowerCase() === '' ? i : i.nom.toLowerCase().includes(nomassociation);
            }).map((a, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', '&:last-child': { borderBottom: 'none' } }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                  {a.nom}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                  {a.description}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6366f1' }}>
                  {a.user.email}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    backgroundColor: a.user.is_active ? '#dcfce7' : '#fef3c7',
                    color: a.user.is_active ? '#166534' : '#92400e',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {a.user.is_active ? "Validée" : "En attente"}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: '#6b7280',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => showAssociationDetails(a)}
                    title="Voir les détails"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: a.user.is_active ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => { activeroudesactivercompte(a.id) }}
                  >
                    {a.user.is_active ? "Désactiver" : "Activer"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {associationsFiltrees.filter((i) => {
          return nomassociation.toLowerCase() === '' ? i : i.nom.toLowerCase().includes(nomassociation);
        }).length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            Aucune association trouvée
          </div>
        )}
      </div>
    </div>
  )
}