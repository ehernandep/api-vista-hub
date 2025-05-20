
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, ArrowUpRight, Clock, Database, Globe, 
  BookOpen, Code, CheckCircle, XCircle, 
  Loader2, ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { fetchApiById, Api, ApiEndpoint } from "@/services/apiService";

const EndpointCard = ({ endpoint }: { endpoint: ApiEndpoint }) => {
  const methodColors = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    POST: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
  };

  const getMethodColor = (method: string) => {
    return methodColors[method as keyof typeof methodColors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
            {endpoint.path}
          </code>
        </div>
        <p className="text-sm text-muted-foreground">
          {endpoint.description}
        </p>
      </CardContent>
    </Card>
  );
};

const ViewApi = () => {
  const { id } = useParams<{ id: string }>();
  const [api, setApi] = useState<Api | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("documentation");

  useEffect(() => {
    const loadApi = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const apiData = await fetchApiById(id);
        setApi(apiData);
      } catch (error) {
        console.error("Error loading API:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApi();
  }, [id]);

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Cargando detalles de la API...</p>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">API no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            No pudimos encontrar la API que buscas.
          </p>
          <Button asChild>
            <Link to="/search" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Volver a la búsqueda
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="p-0">
          <Link to="/search">
            <ChevronLeft className="h-4 w-4" />
            <span>Volver</span>
          </Link>
        </Button>
      </div>

      {/* API Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{api.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <Badge variant="outline" className="text-xs">v{api.version}</Badge>
              {api.category && (
                <Badge style={{ backgroundColor: api.category.color }} className="text-white">
                  {api.category.name}
                </Badge>
              )}
              
              <span className="text-sm text-muted-foreground ml-1">
                por {api.owner}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={api.base_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Base URL
              </a>
            </Button>
            
            {api.documentation_url && (
              <Button size="sm" asChild>
                <a href={api.documentation_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Documentación
                </a>
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-muted-foreground mt-2">
          {api.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-4">
          {api.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* API Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Total Llamadas</div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatNumber(api.stats?.total_calls || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Última Semana</div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatNumber(api.stats?.last_week_calls || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Uptime</div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {api.stats?.uptime || 99.9}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Tiempo de Respuesta</div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {api.stats?.response_time || 0}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Content Tabs */}
      <Tabs 
        defaultValue="documentation" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="documentation">Documentación</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="authentication">Autenticación</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documentation" className="space-y-4 mt-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h3>Base URL</h3>
            <div className="bg-muted rounded-md p-3 font-mono text-sm mb-6">
              {api.base_url}
            </div>
            
            <h3>Descripción</h3>
            <p>{api.description}</p>
            
            <h3>Propietario</h3>
            <p>{api.owner}</p>
            
            <Separator className="my-6" />
            
            <h3>Versiones</h3>
            <div className="flex gap-2">
              <Badge>v{api.version}</Badge>
              <Badge variant="outline">Actual</Badge>
            </div>
            
            {api.documentation_url && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3>Documentación Oficial</h3>
                  <p>
                    Consulta la documentación completa de la API en el sitio oficial:
                  </p>
                  <Button variant="outline" asChild className="mt-2">
                    <a 
                      href={api.documentation_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Ver documentación completa
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="endpoints" className="space-y-6 mt-6">
          {api.endpoints && api.endpoints.length > 0 ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">Endpoints Disponibles</h3>
                <p className="text-sm text-muted-foreground">
                  Esta API expone {api.endpoints.length} endpoints para interactuar con sus recursos.
                </p>
              </div>
              
              <div>
                {api.endpoints.map((endpoint) => (
                  <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay endpoints disponibles</h3>
              <p className="text-muted-foreground">
                No se encontraron endpoints documentados para esta API.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="authentication" className="space-y-4 mt-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h3>Método de Autenticación</h3>
            
            <div className="flex items-center gap-2 my-4">
              {api.auth_type === 'none' ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  No requiere autenticación
                </Badge>
              ) : api.auth_type === 'apiKey' ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                  <Key className="h-3 w-3 mr-1" />
                  API Key
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200">
                  <Lock className="h-3 w-3 mr-1" />
                  OAuth 2.0
                </Badge>
              )}
            </div>
            
            <div className="mb-6">
              {api.auth_type === 'none' ? (
                <p>Esta API no requiere autenticación para ser utilizada.</p>
              ) : (
                <p>{api.auth_description || `Esta API utiliza ${api.auth_type} para la autenticación. Consulta la documentación oficial para más detalles.`}</p>
              )}
            </div>
            
            {api.auth_type !== 'none' && (
              <>
                <h3>Instrucciones</h3>
                {api.auth_type === 'apiKey' ? (
                  <div className="bg-muted rounded-md p-4 mb-4">
                    <h4 className="text-sm font-semibold mb-2">Ejemplo de uso con API Key</h4>
                    <pre className="bg-muted-foreground/10 p-2 rounded overflow-x-auto text-xs">
                      <code>curl -H "X-API-Key: your_api_key_here" {api.base_url}/endpoint</code>
                    </pre>
                  </div>
                ) : (
                  <div className="bg-muted rounded-md p-4 mb-4">
                    <h4 className="text-sm font-semibold mb-2">Ejemplo de uso con OAuth 2.0</h4>
                    <pre className="bg-muted-foreground/10 p-2 rounded overflow-x-auto text-xs">
                      <code>curl -H "Authorization: Bearer your_access_token" {api.base_url}/endpoint</code>
                    </pre>
                  </div>
                )}
              </>
            )}
            
            {api.documentation_url && (
              <Button variant="outline" asChild>
                <a 
                  href={api.documentation_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver documentación de autenticación
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// This component needs to be declared for TypeScript
const Key = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
  );
};

// This component needs to be declared for TypeScript
const Lock = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
};

export default ViewApi;
