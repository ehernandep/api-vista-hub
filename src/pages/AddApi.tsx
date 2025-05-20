
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { fetchApiCategories, createApi, ApiCategory } from "@/services/apiService";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  base_url: z.string().url("Ingresa una URL válida"),
  version: z.string().min(1, "La versión es obligatoria"),
  documentation_url: z.string().url("Ingresa una URL válida").optional().or(z.literal("")),
  owner: z.string().min(1, "El propietario es obligatorio"),
  category_id: z.string().min(1, "La categoría es obligatoria"),
  auth_type: z.enum(["apiKey", "oauth2", "none"]),
  auth_description: z.string().optional(),
});

// Crear un esquema para los endpoints
const endpointSchema = z.object({
  path: z.string().min(1, "El path es obligatorio"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
});

const AddApi = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [endpoints, setEndpoints] = useState<{
    path: string;
    method: string;
    description: string;
  }[]>([]);
  const [newEndpoint, setNewEndpoint] = useState({
    path: "",
    method: "GET",
    description: "",
  });

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      base_url: "",
      version: "v1.0",
      documentation_url: "",
      owner: "",
      category_id: "",
      auth_type: "none",
      auth_description: "",
    },
  });

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchApiCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Tag handlers
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Endpoint handlers
  const validateEndpoint = () => {
    try {
      endpointSchema.parse(newEndpoint);
      return true;
    } catch (error) {
      return false;
    }
  };

  const addEndpoint = () => {
    if (validateEndpoint()) {
      setEndpoints([...endpoints, { ...newEndpoint }]);
      setNewEndpoint({
        path: "",
        method: "GET",
        description: "",
      });
    } else {
      toast({
        title: "Endpoint inválido",
        description: "Asegúrate de completar todos los campos del endpoint correctamente",
        variant: "destructive",
      });
    }
  };

  const removeEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    
    try {
      // Prepare API data
      const apiData = {
        ...values,
        tags,
        endpoints: endpoints.map(endpoint => ({
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
        })),
      };
      
      // Create API in Supabase
      const createdApi = await createApi(apiData);
      
      if (createdApi) {
        toast({
          title: "API creada",
          description: "La API ha sido creada correctamente",
        });
        
        // Redirect to the API view page
        navigate(`/view/${createdApi.id}`);
      } else {
        throw new Error("No se pudo crear la API");
      }
    } catch (error) {
      console.error("Error creating API:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al crear la API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Añadir Nueva API</h1>
        <p className="text-muted-foreground">
          Registra una nueva API en el marketplace para compartir con otros
          desarrolladores.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Introduce la información principal de la API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Payment Gateway API" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nombre descriptivo para la API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión</FormLabel>
                      <FormControl>
                        <Input placeholder="v1.0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Versión actual de la API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="API para procesamiento de pagos con múltiples métodos"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe brevemente lo que hace la API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propietario</FormLabel>
                      <FormControl>
                        <Input placeholder="FinTech Solutions" {...field} />
                      </FormControl>
                      <FormDescription>
                        Empresa o entidad dueña de la API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingCategories ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Cargando...
                            </div>
                          ) : categories.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground">
                              No hay categorías disponibles
                            </div>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  ></div>
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Clasifica la API en una categoría
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No hay etiquetas añadidas
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva etiqueta"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Añade etiquetas para facilitar la búsqueda de la API
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>URLs y Endpoints</CardTitle>
              <CardDescription>
                Configura las URLs y endpoints de la API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="base_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Base</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://api.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL base para las llamadas a la API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentation_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Documentación</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://docs.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL a la documentación completa (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Endpoints</h3>
                  <Badge variant="outline">
                    {endpoints.length} endpoint
                    {endpoints.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="endpoint-method">Método</Label>
                      <Select
                        value={newEndpoint.method}
                        onValueChange={(value) =>
                          setNewEndpoint({ ...newEndpoint, method: value })
                        }
                      >
                        <SelectTrigger id="endpoint-method">
                          <SelectValue placeholder="GET" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="endpoint-path">Path</Label>
                      <Input
                        id="endpoint-path"
                        placeholder="/v1/resources"
                        value={newEndpoint.path}
                        onChange={(e) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            path: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="endpoint-description">
                        Descripción
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="endpoint-description"
                          placeholder="Describe lo que hace este endpoint"
                          value={newEndpoint.description}
                          onChange={(e) =>
                            setNewEndpoint({
                              ...newEndpoint,
                              description: e.target.value,
                            })
                          }
                        />
                        <Button
                          type="button"
                          onClick={addEndpoint}
                          variant="outline"
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {endpoints.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Método</th>
                            <th className="px-4 py-2 text-left">Path</th>
                            <th className="px-4 py-2 text-left">
                              Descripción
                            </th>
                            <th className="px-4 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoints.map((endpoint, index) => (
                            <tr
                              key={index}
                              className="border-t"
                            >
                              <td className="px-4 py-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    endpoint.method === "GET"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                      : endpoint.method === "POST"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : endpoint.method === "PUT"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                      : endpoint.method === "DELETE"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                  }
                                >
                                  {endpoint.method}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                {endpoint.path}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {endpoint.description}
                              </td>
                              <td className="px-4 py-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeEndpoint(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Autenticación</CardTitle>
              <CardDescription>
                Configura el método de autenticación de la API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="auth_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Autenticación</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de autenticación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No requiere</SelectItem>
                        <SelectItem value="apiKey">API Key</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Método de autenticación requerido para usar la API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("auth_type") !== "none" && (
                <FormField
                  control={form.control}
                  name="auth_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de la Autenticación</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explica cómo obtener y utilizar las credenciales de autenticación"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Proporciona información adicional sobre el proceso de
                        autenticación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar API
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddApi;
