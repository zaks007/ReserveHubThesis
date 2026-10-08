import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  MapPin,
  DoorOpen,
  CalendarDays,
  Check,
  X,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Building as BuildingIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, statusBadgeClass, statusLabel } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import { toast } from "@/hooks/use-toast";

type CampusTab = "spaces" | "bookings";

const CampusAdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, updateStatus } = useBookings();
  const { institutions, saveRow, deleteRow } = useInstitutions();

  const [tab, setTab] = useState<CampusTab>("spaces");

  // State for building / room editing modals
  const [editingBuilding, setEditingBuilding] = useState<{ id: string | null; name: string; address: string } | null>(null);
  const [editingRoom, setEditingRoom] = useState<{
    id: string | null;
    buildingId: string;
    name: string;
    capacity: number;
    pricePerHour: number;
    features: string;
    image: string;
    available: boolean;
  } | null>(null);

  // Local overrides for demo / immediate UI responsiveness
  const [demoBuildings, setDemoBuildings] = useState<any[]>([]);
  const [demoRooms, setDemoRooms] = useState<any[]>([]);

  if (!user || (user.role !== "campus_admin" && user.role !== "super_admin")) {
    return <Navigate to="/" replace />;
  }

  // Find university and campus
  const uni = institutions.find((i) => i.type === "university") || institutions[0];
  const userCampusId = user.campusId || "c1"; // default to Kassai Campus if not explicitly set
  const campus = uni?.campuses?.find((c) => c.id === userCampusId) || uni?.campuses?.[0];

  if (!uni || !campus) {
    return (
      <div className="container py-16 max-w-md text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No campus found.</p>
      </div>
    );
  }

  // Combine campus buildings with local demo creations/edits
  const baseBuildings = campus.buildings || [];
  const buildings = [
    ...baseBuildings.filter((b) => !demoBuildings.some((db) => db.id === b.id && db._deleted)),
    ...demoBuildings.filter((db) => !db._deleted && !baseBuildings.some((b) => b.id === db.id)),
  ].map((b) => {
    const override = demoBuildings.find((db) => db.id === b.id);
    return override ? { ...b, ...override } : b;
  });

  // Flat list of rooms
  const baseRooms = buildings.flatMap((b) =>
    (b.spaces || []).map((s: any) => ({
      ...s,
      buildingId: b.id,
      buildingName: b.name,
    }))
  );

  const rooms = [
    ...baseRooms.filter((r) => !demoRooms.some((dr) => dr.id === r.id && dr._deleted)),
    ...demoRooms.filter((dr) => !dr._deleted && !baseRooms.some((r) => r.id === dr.id)),
  ].map((r) => {
    const override = demoRooms.find((dr) => dr.id === r.id);
    return override ? { ...r, ...override } : r;
  });

  const myBookings = bookings.filter(
    (b) => b.institutionId === uni.id && (b.campusId === campus.id || !b.campusId)
  );

  // SAVE BUILDING
  const handleSaveBuilding = async () => {
    if (!editingBuilding || !editingBuilding.name.trim()) {
      toast({ title: "Building name is required", variant: "destructive" });
      return;
    }

    try {
      if (!user.isDemo) {
        await saveRow("buildings", editingBuilding.id, {
          name: editingBuilding.name,
          address: editingBuilding.address || null,
          campus_id: campus.id,
          institution_id: uni.id,
        });
      }
    } catch {
      // Fallback to local demo state
    }

    if (editingBuilding.id) {
      setDemoBuildings((prev) =>
        prev.some((b) => b.id === editingBuilding.id)
          ? prev.map((b) => (b.id === editingBuilding.id ? { ...b, ...editingBuilding } : b))
          : [...prev, { ...editingBuilding, spaces: [] }]
      );
    } else {
      const newId = `b-local-${Date.now()}`;
      setDemoBuildings((prev) => [
        ...prev,
        { id: newId, name: editingBuilding.name, address: editingBuilding.address, spaces: [] },
      ]);
    }

    toast({ title: editingBuilding.id ? "Building updated" : "Building created!" });
    setEditingBuilding(null);
  };

  // SAVE ROOM
  const handleSaveRoom = async () => {
    if (!editingRoom || !editingRoom.name.trim()) {
      toast({ title: "Room name is required", variant: "destructive" });
      return;
    }

    const bName = buildings.find((b) => b.id === editingRoom.buildingId)?.name || "Academic Building";

    try {
      if (!user.isDemo) {
        await saveRow("spaces", editingRoom.id, {
          name: editingRoom.name,
          building_id: editingRoom.buildingId,
          capacity: editingRoom.capacity,
          price_per_unit: editingRoom.pricePerHour,
          price_unit: "hour",
          features: editingRoom.features.split(",").map((f) => f.trim()).filter(Boolean),
          image_url: editingRoom.image || null,
          is_active: editingRoom.available,
        });
      }
    } catch {
      // Fallback to local demo state
    }

    const featuresArray = editingRoom.features.split(",").map((f) => f.trim()).filter(Boolean);

    if (editingRoom.id) {
      setDemoRooms((prev) =>
        prev.some((r) => r.id === editingRoom.id)
          ? prev.map((r) =>
              r.id === editingRoom.id
                ? { ...r, ...editingRoom, features: featuresArray, buildingName: bName }
                : r
            )
          : [...prev, { ...editingRoom, features: featuresArray, buildingName: bName }]
      );
    } else {
      const newId = `s-local-${Date.now()}`;
      setDemoRooms((prev) => [
        ...prev,
        {
          ...editingRoom,
          id: newId,
          features: featuresArray,
          buildingName: bName,
        },
      ]);
    }

    toast({ title: editingRoom.id ? "Room updated" : "New room created!" });
    setEditingRoom(null);
  };

  // TOGGLE ROOM AVAILABILITY
  const handleToggleRoom = (roomId: string, current: boolean) => {
    setDemoRooms((prev) => {
      const exists = prev.some((r) => r.id === roomId);
      if (exists) {
        return prev.map((r) => (r.id === roomId ? { ...r, available: !current } : r));
      }
      const original = rooms.find((r) => r.id === roomId);
      return original ? [...prev, { ...original, available: !current }] : prev;
    });
    toast({ title: !current ? "Room marked Available" : "Room marked Unavailable" });
  };

  // DELETE ITEM
  const handleDelete = async (table: "buildings" | "spaces", id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;

    try {
      if (!user.isDemo) await deleteRow(table, id);
    } catch {
      // Demo fallback
    }

    if (table === "buildings") {
      setDemoBuildings((prev) => [...prev.filter((b) => b.id !== id), { id, _deleted: true }]);
    } else {
      setDemoRooms((prev) => [...prev.filter((r) => r.id !== id), { id, _deleted: true }]);
    }

    toast({ title: "Deleted", description: name });
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <BuildingIcon className="h-4 w-4" /> {uni.name}
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" /> {campus.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            You have full control to manage and edit all buildings and rooms inside this campus.
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-lg border">
          <Button
            size="sm"
            variant={tab === "spaces" ? "default" : "ghost"}
            onClick={() => setTab("spaces")}
          >
            Manage Rooms & Buildings
          </Button>
          <Button
            size="sm"
            variant={tab === "bookings" ? "default" : "ghost"}
            onClick={() => setTab("bookings")}
          >
            Bookings ({myBookings.filter((b) => b.status === "pending").length} pending)
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
            <DoorOpen className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{rooms.length}</p>
          <p className="text-sm text-muted-foreground">Rooms across {buildings.length} buildings</p>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{myBookings.length}</p>
          <p className="text-sm text-muted-foreground">Total campus reservations</p>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-amber-500/15 text-amber-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">
            {myBookings.filter((b) => b.status === "pending").length}
          </p>
          <p className="text-sm text-muted-foreground">Awaiting approval</p>
        </div>
      </div>

      {/* EDIT BUILDING FORM */}
      {editingBuilding && (
        <div className="border-2 border-primary/40 rounded-xl p-5 bg-card shadow-md space-y-4">
          <h3 className="font-semibold text-lg">
            {editingBuilding.id ? "Edit Building" : "Add Building to Campus"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Building Name *
              </label>
              <input
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingBuilding.name}
                onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                placeholder="e.g. Building A (Informatics)"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Address / Location
              </label>
              <input
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingBuilding.address}
                onChange={(e) => setEditingBuilding({ ...editingBuilding, address: e.target.value })}
                placeholder="e.g. Kassai út 26"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditingBuilding(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveBuilding}>
              Save Building
            </Button>
          </div>
        </div>
      )}

      {/* EDIT ROOM FORM */}
      {editingRoom && (
        <div className="border-2 border-primary/40 rounded-xl p-5 bg-card shadow-md space-y-4">
          <h3 className="font-semibold text-lg">
            {editingRoom.id ? "Edit Room" : "Add New Room"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Room Name *
              </label>
              <input
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingRoom.name}
                onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                placeholder="e.g. Room F01 Lecture Hall"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Building</label>
              <select
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingRoom.buildingId}
                onChange={(e) => setEditingRoom({ ...editingRoom, buildingId: e.target.value })}
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingRoom.capacity}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Price (HUF / hour)
              </label>
              <input
                type="number"
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingRoom.pricePerHour}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, pricePerHour: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Features (comma separated)
              </label>
              <input
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingRoom.features}
                onChange={(e) => setEditingRoom({ ...editingRoom, features: e.target.value })}
                placeholder="Projector, Whiteboard, Wi-Fi, Air Conditioning"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditingRoom(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveRoom}>
              Save Room
            </Button>
          </div>
        </div>
      )}

      {/* TAB 1: SPACES & BUILDINGS MANAGEMENT */}
      {tab === "spaces" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Campus Rooms & Buildings</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingBuilding({ id: null, name: "", address: "" })}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Building
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  setEditingRoom({
                    id: null,
                    buildingId: buildings[0]?.id || "",
                    name: "",
                    capacity: 25,
                    pricePerHour: 0,
                    features: "Projector, Whiteboard",
                    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60",
                    available: true,
                  })
                }
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Room
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                No rooms listed on this campus yet. Click "+ Add Room" to create one.
              </div>
            )}
            {rooms.map((r) => (
              <div
                key={r.id}
                className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base line-clamp-1">{r.name}</h3>
                    <button
                      type="button"
                      onClick={() => handleToggleRoom(r.id, r.available)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                        r.available
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {r.available ? "Available" : "Unavailable"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.buildingName} · Cap. {r.capacity} · {r.pricePerHour ? `${r.pricePerHour} HUF/hr` : "Free"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Features: {Array.isArray(r.features) ? r.features.join(", ") : r.features || "Standard"}
                  </p>
                </div>

                <div className="flex justify-end gap-1 pt-3 mt-3 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEditingRoom({
                        id: r.id,
                        buildingId: r.buildingId,
                        name: r.name,
                        capacity: r.capacity,
                        pricePerHour: r.pricePerHour,
                        features: Array.isArray(r.features) ? r.features.join(", ") : r.features,
                        image: r.image,
                        available: r.available,
                      })
                    }
                    className="h-8 gap-1 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete("spaces", r.id, r.name)}
                    className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS */}
      {tab === "bookings" && (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-semibold">Room</th>
                <th className="text-left p-4 font-semibold">When</th>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No bookings for this campus yet.
                  </td>
                </tr>
              )}
              {myBookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{b.spaceName}</td>
                  <td className="p-4 text-muted-foreground">
                    {b.date} · {b.startTime}-{b.endTime}
                  </td>
                  <td className="p-4 text-muted-foreground">{b.userEmail}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClass[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    {b.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateStatus(b.id, "approved");
                            toast({ title: "Booking approved" });
                          }}
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateStatus(b.id, "rejected");
                            toast({ title: "Booking rejected" });
                          }}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CampusAdminDashboard;
