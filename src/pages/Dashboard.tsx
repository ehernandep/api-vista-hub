
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Users, Database, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { fetchApis, getDashboardMetrics } from "@/services/apiService";
import { Api } from "@/services/apiService";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [apis, setApis] = useState<Api[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [apisData, metricsData] = await Promise.all([
          fetchApis(),
          getDashboardMetrics(),
        ]);
        setApis(apisData);
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Formato para números grandes
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de APIs y métricas principales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("week")}
          >
            Semana
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
          >
            Mes
          </Button>
          <Button
            variant={timeRange === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("year")}
          >
            Año
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              APIs Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics?.totalApis || 0}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                <ArrowUp className="h-3 w-3" />
                <span>+{metrics?.newApisLastMonth || 0}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.newApisLastMonth || 0} nuevas APIs este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Llamadas a APIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics?.totalApiCalls || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +15% desde el mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metrics?.activeUsers || 0}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Activos en los últimos 30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo de Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">135ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio general de todas las APIs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* API Calls Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Llamadas a APIs por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.apiCallsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => formatNumber(value)}
                    width={40}
                  />
                  <RechartsTooltip
                    formatter={(value) => [
                      formatNumber(value as number),
                      "Llamadas",
                    ]}
                  />
                  <Bar
                    dataKey="calls"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Distribución por Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.popularCategories?.map((category: any) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.percentage}%
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
              {(!metrics?.popularCategories || metrics.popularCategories.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de categorías disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top APIs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">APIs Populares</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search" className="flex items-center gap-1">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apis.slice(0, 3).map((api) => (
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
                    <span>{formatNumber(api.stats?.total_calls || 0)} llamadas</span>
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
          {apis.length === 0 && (
            <div className="col-span-3 text-center py-12 border border-dashed rounded-lg">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay APIs disponibles</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera API para verla aquí
              </p>
              <Button asChild>
                <Link to="/add">Añadir API</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
