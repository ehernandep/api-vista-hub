import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { X, PlusCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createApi, fetchApiCategories, ApiCategory } from "@/services/apiService";

// Validation schema for the form
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  version: z.string().default("v1"),
  owner: z.string().min(3, "Owner name is required"),
  base_url: z.string().url("Must be a valid URL"),
  documentation_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category_id: z.string().min(1, "Category is required"),
  auth_type: z.enum(["apiKey", "oauth2", "none"]).default("none"),
  auth_description: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const AddApi = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // Endpoints state
  const [endpoints, setEndpoints] = useState<{path: string; method: string; description: string}[]>([
    { path: "", method: "GET", description: "" }
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      version: "v1",
      owner: "",
      base_url: "",
      documentation_url: "",
      category_id: "",
      auth_type: "none",
      auth_description: "",
    },
  });
  
  // Load categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchApiCategories();
      setCategories(data);
    };
    loadCategories();
  }, []);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddEndpoint = () => {
    setEndpoints([...endpoints, { path: "", method: "GET", description: "" }]);
  };

  const handleRemoveEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const handleEndpointChange = (index: number, field: string, value: string) => {
    const updatedEndpoints = [...endpoints];
    updatedEndpoints[index] = { ...updatedEndpoints[index], [field]: value };
    setEndpoints(updatedEndpoints);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Validate endpoints
      const validEndpoints = endpoints.filter(endpoint => 
        endpoint.path.trim() !== "" && endpoint.description.trim() !== ""
      );
      
      if (validEndpoints.length === 0) {
        toast({
          title: "Error",
          description: "At least one valid endpoint is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Create API object with all required fields
      const newApi = {
        ...values,
        // Ensure all required fields are present
        name: values.name,
        description: values.description,
        version: values.version || "v1",
        owner: values.owner,
        base_url: values.base_url,
        documentation_url: values.documentation_url || null,
        category_id: values.category_id,
        tags: tags,
        auth_type: values.auth_type as 'apiKey' | 'oauth2' | 'none',
        auth_description: values.auth_description || null,
        endpoints: validEndpoints,
      };
      
      const result = await createApi(newApi);
      
      if (result) {
        toast({
          title: "Success",
          description: "API created successfully",
        });
        navigate(`/view/${result.id}`);
      } else {
        throw new Error("Failed to create API");
      }
    } catch (error) {
      console.error("Error creating API:", error);
      toast({
        title: "Error",
        description: "Failed to create API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New API</h1>
        <p className="text-muted-foreground">
          Fill out the form to add a new API to the catalog.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General information about the API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment Processing API" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A comprehensive API for handling payment processing..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="v1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Organization or developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-secondary-foreground/70 hover:text-secondary-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="ml-2"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
                <FormDescription>
                  Press Enter or click Add to add a tag
                </FormDescription>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API URLs</CardTitle>
              <CardDescription>
                URLs for accessing the API and documentation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://api.example.com/v1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentation_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documentation URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://docs.example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                API authentication details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="auth_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authentication type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="apiKey">API Key</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auth_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Include the API key in the 'Authorization' header..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>
                  Define the available endpoints for this API.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEndpoint}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="border rounded-md p-4 space-y-4 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveEndpoint(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <FormLabel>Method</FormLabel>
                      <Select
                        value={endpoint.method}
                        onValueChange={(value) =>
                          handleEndpointChange(index, "method", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    <div className="col-span-3">
                      <FormLabel>Path</FormLabel>
                      <Input
                        value={endpoint.path}
                        onChange={(e) =>
                          handleEndpointChange(index, "path", e.target.value)
                        }
                        placeholder="/users/{id}"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={endpoint.description}
                      onChange={(e) =>
                        handleEndpointChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Get user details by ID"
                    />
                  </div>
                </div>
              ))}
              {endpoints.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No endpoints defined. Click &quot;Add Endpoint&quot; to define an API
                  endpoint.
                </div>
              )}
            </CardContent>
          </Card>

          <CardFooter className="flex justify-between border rounded-lg p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create API"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
};

export default AddApi;
