import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { Edit, Trash2, Plus, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { leadsAPI } from '../services/api';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface Lead {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  state: string;
  source: string;
  status: string;
  score: number;
  lead_value: number;
  is_qualified: boolean;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [showFilters, setShowFilters] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await leadsAPI.getLeads(params);
      setLeads(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadsAPI.deleteLead(id);
        toast.success('Lead deleted successfully');
        loadLeads();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete lead');
      }
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/leads/edit/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const applyFilters = (newFilters: { [key: string]: any }) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const ActionsCellRenderer = (params: any) => {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleEdit(params.data._id)}
          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(params.data._id)}
          className="p-1 text-red-600 hover:text-red-800 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const StatusCellRenderer = (params: any) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      won: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[params.value as keyof typeof statusColors]}`}>
        {params.value}
      </span>
    );
  };

  const SourceCellRenderer = (params: any) => {
    const sourceLabels = {
      website: 'Website',
      facebook_ads: 'Facebook Ads',
      google_ads: 'Google Ads',
      referral: 'Referral',
      events: 'Events',
      other: 'Other'
    };

    return sourceLabels[params.value as keyof typeof sourceLabels] || params.value;
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'Name',
      valueGetter: (params) => `${params.data.first_name} ${params.data.last_name}`,
      sortable: true,
      filter: true,
      minWidth: 150
    },
    {
      headerName: 'Email',
      field: 'email',
      sortable: true,
      filter: true,
      minWidth: 200
    },
    {
      headerName: 'Company',
      field: 'company',
      sortable: true,
      filter: true,
      minWidth: 150
    },
    {
      headerName: 'Location',
      valueGetter: (params) => `${params.data.city}, ${params.data.state}`,
      sortable: true,
      filter: true,
      minWidth: 150
    },
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: StatusCellRenderer,
      sortable: true,
      filter: true,
      width: 120
    },
    {
      headerName: 'Source',
      field: 'source',
      cellRenderer: SourceCellRenderer,
      sortable: true,
      filter: true,
      width: 120
    },
    {
      headerName: 'Score',
      field: 'score',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 100
    },
    {
      headerName: 'Value',
      field: 'lead_value',
      valueFormatter: (params) => `$${params.value.toLocaleString()}`,
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 120
    },
    {
      headerName: 'Qualified',
      field: 'is_qualified',
      cellRenderer: (params: any) => params.value ? '✅' : '❌',
      sortable: true,
      filter: true,
      width: 100
    },
    {
      headerName: 'Created',
      field: 'created_at',
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 120
    },
    {
      headerName: 'Actions',
      cellRenderer: ActionsCellRenderer,
      sortable: false,
      filter: false,
      width: 100,
      pinned: 'right'
    }
  ];

  return (
    <Layout title="Leads Dashboard">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/leads/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Lead
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <FilterPanel filters={filters} onApplyFilters={applyFilters} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
            <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Qualified</h3>
            <p className="text-3xl font-bold text-green-600">
              {leads.filter(lead => lead.is_qualified).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">New Leads</h3>
            <p className="text-3xl font-bold text-blue-600">
              {leads.filter(lead => lead.status === 'new').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${leads.reduce((sum, lead) => sum + lead.lead_value, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <>
              <div className="ag-theme-alpine h-96">
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={leads}
                  pagination={false}
                  suppressPaginationPanel={true}
                  rowHeight={50}
                  headerHeight={50}
                />
              </div>
              
              {/* Custom Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} entries
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded text-sm transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Filter Panel Component
interface FilterPanelProps {
  filters: { [key: string]: any };
  onApplyFilters: (filters: { [key: string]: any }) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: any) => {
    if (value === '') {
      const newFilters = { ...localFilters };
      delete newFilters[key];
      setLocalFilters(newFilters);
    } else {
      setLocalFilters({
        ...localFilters,
        [key]: value
      });
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
            <option value="won">Won</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select
            value={localFilters.source || ''}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="facebook_ads">Facebook Ads</option>
            <option value="google_ads">Google Ads</option>
            <option value="referral">Referral</option>
            <option value="events">Events</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qualified</label>
          <select
            value={localFilters.is_qualified !== undefined ? localFilters.is_qualified.toString() : ''}
            onChange={(e) => handleFilterChange('is_qualified', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Contains</label>
          <input
            type="text"
            placeholder="Company name..."
            value={localFilters.company_contains || ''}
            onChange={(e) => handleFilterChange('company_contains', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Dashboard;