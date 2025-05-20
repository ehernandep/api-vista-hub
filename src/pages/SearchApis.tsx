
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Database,
  ListFilter,
  Clock,
  Hash,
  CheckSquare,
  Code,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchApis, fetchApiCategories, ApiCategory, Api } from "@/services/apiService";

interface Filters {
  category: string;
  authType: string;
  sortBy: "name" | "date" | "popularity" | "rating";
}

const SearchApis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    authType: "all",
    sortBy: "popularity",
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [apis, setApis] = useState<Api[]>([]);
  const [filteredApis, setFilteredApis] = useState<Api[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch APIs and categories on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [apisData, categoriesData] = await Promise.all([
          fetchApis(),
          fetchApiCategories(),
        ]);
        setApis(apisData);
        setFilteredApis(apisData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Aplicar filtros cuando cambian
  useEffect(() => {
    if (apis.length === 0) return;
    
    let results = [...apis];
    
    // Filtrado por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (api) =>
          api.name.toLowerCase().includes(query) ||
          api.description.toLowerCase().includes(query) ||
          api.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    
    // Filtrado por categoría
    if (filters.category !== "all") {
      results = results.filter((api) => api.category_id === filters.category);
    }
    
    // Filtrado por tipo de autenticación
    if (filters.authType !== "all") {
      results = results.filter((api) => api.auth_type === filters.authType);
    }
    
    // Ordenamiento
    switch (filters.sortBy) {
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "date":
        results.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "popularity":
        results.sort((a, b) => (b.stats?.total_calls || 0) - (a.stats?.total_calls || 0));
        break;
      case "rating":
        results.sort((a, b) => (b.stats?.uptime || 0) - (a.stats?.uptime || 0));
        break;
    }
    
    setFilteredApis(results);
    
    // Actualizar filtros activos para mostrarlos como chips
    const active: string[] = [];
    if (filters.category !== "all") {
      const category = categories.find((c) => c.id === filters.category);
      if (category) active.push(`Categoría: ${category.name}`);
    }
    if (filters.authType !== "all") {
      const authTypes: Record<string, string> = {
        apiKey: "API Key",
        oauth2: "OAuth 2.0",
        none: "Sin autenticación",
      };
      active.push(`Auth: ${authTypes[filters.authType]}`);
    }
    setActiveFilters(active);
  }, [searchQuery, filters, apis, categories]);

  // Formatea el número de llamadas
  const formatCalls = (calls: number) => {
    if (calls >= 1000000) {
      return `${(calls / 1000000).toFixed(1)}M`;
    } else if (calls >= 1000) {
      return `${(calls / 1000).toFixed(1)}K`;
    }
    return calls.toString();
  };

  // Resetea todos los filtros
  const resetFilters = () => {
    setFilters({
      category: "all",
      authType: "all",
      sortBy: "popularity",
    });
    setSearchQuery("");
  };

  // Quita un filtro específico
  const removeFilter = (filter: string) => {
    if (filter.startsWith("Categoría:")) {
      setFilters({ ...filters, category: "all" });
    } else if (filter.startsWith("Auth:")) {
      setFilters({ ...filters, authType: "all" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Cargando APIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Explorar APIs</h1>
        <p className="text-muted-foreground">
          Encuentra APIs públicas para integrar en tus proyectos
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar APIs por nombre, descripción o etiquetas"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-grow">
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters({ ...filters, category: value })
              }
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <ListFilter className="mr-2 h-4 w-4" />
                  <span>Categoría</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.authType}
              onValueChange={(value) =>
                setFilters({ ...filters, authType: value as any })
              }
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  <span>Autenticación</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="apiKey">API Key</SelectItem>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="none">Sin autenticación</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({ ...filters, sortBy: value as any })
              }
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Ordenar por</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularidad</SelectItem>
                <SelectItem value="date">Más recientes</SelectItem>
                <SelectItem value="name">Alfabético</SelectItem>
                <SelectItem value="rating">Mayor uptime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={displayMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setDisplayMode("grid")}
              className="hidden sm:flex"
            >
              <Hash className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setDisplayMode("list")}
              className="hidden sm:flex"
            >
              <Code className="h-4 w-4" />
            </Button>
            {(activeFilters.length > 0 || searchQuery) && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="mr-1 h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros activos */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="outline" className="pl-2">
                {filter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 p-0"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Resultados de la búsqueda */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {filteredApis.length} APIs encontradas
        </h2>
        <div className="flex sm:hidden gap-2">
          <Button
            variant={displayMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setDisplayMode("grid")}
          >
            <Hash className="h-4 w-4" />
          </Button>
          <Button
            variant={displayMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setDisplayMode("list")}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredApis.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-xl font-medium mb-2">No se encontraron APIs</h3>
          <p className="text-muted-foreground">
            Prueba con otros términos de búsqueda o filtros
          </p>
          <Button className="mt-4" onClick={resetFilters}>
            Ver todas las APIs
          </Button>
        </div>
      ) : displayMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApis.map((api) => (
            <Card key={api.id} className="api-card api-card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {api.name}
                  </CardTitle>
                  {api.category && (
                    <Badge
                      style={{ backgroundColor: api.category.color }}
                      className="text-white"
                    >
                      {api.category.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {api.description}
                </p>

                <div className="flex flex-wrap gap-1 mt-2">
                  {api.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>{formatCalls(api.stats?.total_calls || 0)} llamadas</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">
                      {api.stats?.uptime || 99.9}% uptime
                    </span>
                  </div>
                </div>

                <Button asChild className="w-full mt-2" variant="outline">
                  <Link to={`/view/${api.id}`}>Ver detalles</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredApis.map((api) => (
            <Card key={api.id} className="api-card">
              <div className="flex flex-col sm:flex-row sm:items-center p-4">
                <div className="flex-grow">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{api.name}</h3>
                    {api.category && (
                      <Badge
                        style={{ backgroundColor: api.category.color }}
                        className="text-white"
                      >
                        {api.category.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {api.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {api.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {formatCalls(api.stats?.total_calls || 0)} llamadas
                    </span>
                    <Separator orientation="vertical" className="h-3" />
                    <span className="text-green-600">
                      {api.stats?.uptime || 99.9}% uptime
                    </span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>
                      Auth: {api.auth_type === "none" ? "No requiere" : api.auth_type}
                    </span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex-shrink-0">
                  <Button asChild variant="outline">
                    <Link to={`/view/${api.id}`}>Ver documentación</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchApis;
