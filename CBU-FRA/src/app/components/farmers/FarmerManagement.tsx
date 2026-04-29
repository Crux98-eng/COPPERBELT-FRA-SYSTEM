import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";

const farmersData = [
  {
    id: "F001",
    name: "Joseph Mwansa",
    nrc: "123456/78/1",
    location: "Chipata, Eastern",
    crop: "Maize",
    status: "active",
    registered: "2026-01-15",
  },
  {
    id: "F002",
    name: "Mary Phiri",
    nrc: "234567/89/2",
    location: "Lusaka, Lusaka",
    crop: "Groundnuts",
    status: "active",
    registered: "2026-02-10",
  },
  {
    id: "F003",
    name: "John Banda",
    nrc: "345678/90/3",
    location: "Ndola, Copperbelt",
    crop: "Soya Beans",
    status: "pending",
    registered: "2026-04-18",
  },
  {
    id: "F004",
    name: "Grace Siame",
    nrc: "456789/01/4",
    location: "Mongu, Western",
    crop: "Maize",
    status: "active",
    registered: "2026-03-05",
  },
  {
    id: "F005",
    name: "Peter Zulu",
    nrc: "567890/12/5",
    location: "Livingstone, Southern",
    crop: "Cotton",
    status: "rejected",
    registered: "2026-04-01",
  },
  {
    id: "F006",
    name: "Ruth Mulenga",
    nrc: "678901/23/6",
    location: "Kasama, Northern",
    crop: "Maize",
    status: "active",
    registered: "2026-01-28",
  },
  {
    id: "F007",
    name: "David Lungu",
    nrc: "789012/34/7",
    location: "Chipata, Eastern",
    crop: "Groundnuts",
    status: "pending",
    registered: "2026-04-20",
  },
  {
    id: "F008",
    name: "Alice Tembo",
    nrc: "890123/45/8",
    location: "Lusaka, Lusaka",
    crop: "Maize",
    status: "active",
    registered: "2026-02-14",
  },
  {
    id: "F009",
    name: "Eric Sakala",
    nrc: "890123/45/8",
    location: "Chpata, Eastern",
    crop: "Maize",
    status: "active",
    registered: "2026-02-14",
  },
];

export function FarmerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredFarmers = farmersData.filter((farmer) => {
    const matchesSearch =
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.nrc.includes(searchTerm) ||
      farmer.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || farmer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6  bg-[green]/30 ">
      <div className="flex items-center justify-between mb-6 ">
        <div>
          <h1 className="text-3xl text-foreground mb-2">Farmer Management</h1>
          <p className="text-muted-foreground">
            Manage registered farmers and their applications
          </p>
        </div>
        {/* <Link
          to="/register"
          className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Register New Farmer
        </Link> */}
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, NRC, or Farmer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {/* <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  Farmer ID
                </th> */}
                <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  NRC
                </th>
                <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  Crop Type
                </th>
                <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFarmers.map((farmer) => (
                <tr
                  key={farmer.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  {/* <td className="px-6 py-4 text-sm text-card-foreground">
                    {farmer.id}
                  </td> */}
                  <td className="px-6 py-4 text-sm text-card-foreground">
                    {farmer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {farmer.nrc}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {farmer.location}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {farmer.crop}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(farmer.status)}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/dashboard/farmers/${farmer.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredFarmers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No farmers found matching your criteria
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {filteredFarmers.length} of {farmersData.length} farmers
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-muted/50">
              Previous
            </button>
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded">
              1
            </button>
            <button className="px-3 py-1 border border-border rounded hover:bg-muted/50">
              2
            </button>
            <button className="px-3 py-1 border border-border rounded hover:bg-muted/50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
