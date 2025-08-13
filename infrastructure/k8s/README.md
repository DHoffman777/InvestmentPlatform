# Investment Platform Kubernetes Configuration

This directory contains Kubernetes manifests for deploying the Investment Platform in a Kubernetes cluster.

## Directory Structure

```
k8s/
├── README.md                    # This file
├── namespace.yaml              # Namespaces for different environments
├── postgres-deployment.yaml    # PostgreSQL database deployment
├── redis-deployment.yaml      # Redis cache deployment
├── auth-service-deployment.yaml # Authentication service deployment
├── monitoring.yaml             # Prometheus and Grafana monitoring
├── ingress.yaml               # Ingress and network policies
├── rbac.yaml                  # RBAC configurations
├── hpa.yaml                   # Horizontal Pod Autoscaler and security policies
└── kustomization.yaml         # Kustomize configuration
```

## Prerequisites

1. **Kubernetes Cluster**: A running Kubernetes cluster (v1.20+)
2. **kubectl**: Kubernetes CLI tool configured to connect to your cluster
3. **NGINX Ingress Controller**: For ingress routing
4. **Cert-Manager**: For SSL/TLS certificate management
5. **Metrics Server**: For HPA (Horizontal Pod Autoscaler) functionality

## Deployment Instructions

### 1. Install Prerequisites

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install Cert-Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install Metrics Server (if not already installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Deploy the Application

```bash
# Deploy using kubectl
kubectl apply -k .

# Or deploy individual components
kubectl apply -f namespace.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f auth-service-deployment.yaml
kubectl apply -f monitoring.yaml
kubectl apply -f rbac.yaml
kubectl apply -f hpa.yaml
kubectl apply -f ingress.yaml
```

### 3. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n investment-platform

# Check services
kubectl get svc -n investment-platform

# Check ingress
kubectl get ingress -n investment-platform

# Check HPA status
kubectl get hpa -n investment-platform
```

### 4. Access the Application

Once deployed, the application will be available at:

- **API**: `https://api.investment-platform.com`
- **Web Portal**: `https://app.investment-platform.com`
- **Admin Portal**: `https://admin.investment-platform.com`
- **Monitoring**: `https://monitoring.investment-platform.com`

## Configuration

### Environment-Specific Deployments

The configuration supports multiple environments:

- `investment-platform` (development)
- `investment-platform-staging` (staging)
- `investment-platform-prod` (production)

To deploy to a specific environment, update the namespace in the manifests or use Kustomize overlays.

### Secrets Management

**Important**: Update all default secrets before production deployment:

```bash
# Update database credentials
kubectl create secret generic postgres-secret \
  --from-literal=username=your-db-user \
  --from-literal=password=your-secure-db-password \
  -n investment-platform

# Update Redis password
kubectl create secret generic redis-secret \
  --from-literal=password=your-secure-redis-password \
  -n investment-platform

# Update application secrets
kubectl create secret generic auth-secret \
  --from-literal=database-url=postgresql://user:pass@postgres:5432/db \
  --from-literal=redis-url=redis://:pass@redis:6379 \
  --from-literal=jwt-access-secret=your-super-secret-jwt-access-key \
  --from-literal=jwt-refresh-secret=your-super-secret-jwt-refresh-key \
  --from-literal=session-secret=your-super-secret-session-key \
  -n investment-platform
```

### SSL/TLS Certificates

The ingress configuration uses cert-manager for automatic SSL certificate provisioning. Ensure you have:

1. Cert-manager installed in your cluster
2. A ClusterIssuer configured (e.g., Let's Encrypt)
3. DNS records pointing to your ingress controller

### Resource Limits and Requests

All deployments include resource requests and limits:

- **PostgreSQL**: 512Mi-1Gi memory, 250m-500m CPU
- **Redis**: 128Mi-256Mi memory, 100m-200m CPU
- **Auth Service**: 256Mi-512Mi memory, 250m-500m CPU

Adjust these based on your cluster capacity and performance requirements.

### Horizontal Pod Autoscaling

HPA is configured for the auth service:

- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU Target**: 70%
- **Memory Target**: 80%

### Monitoring and Observability

The deployment includes:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards and visualization
- **Service monitors**: Automatic service discovery for metrics

Default credentials:
- Grafana admin password: `admin123` (change in production)

### Security

Security features include:

- **Network policies**: Restrict pod-to-pod communication
- **RBAC**: Role-based access control
- **Pod security policies**: Prevent privileged containers
- **Pod disruption budgets**: Ensure availability during updates
- **Non-root containers**: All containers run as non-root users

## Troubleshooting

### Common Issues

1. **Pods not starting**: Check logs with `kubectl logs -f <pod-name> -n investment-platform`
2. **Database connection issues**: Verify PostgreSQL is running and secrets are correct
3. **Ingress not working**: Check NGINX ingress controller and DNS configuration
4. **SSL certificates**: Verify cert-manager is working and DNS is correctly configured

### Debugging Commands

```bash
# View pod logs
kubectl logs -f deployment/auth-service -n investment-platform

# Describe pod for events
kubectl describe pod <pod-name> -n investment-platform

# Check service endpoints
kubectl get endpoints -n investment-platform

# Test database connection
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -n investment-platform -- psql postgresql://username:password@postgres:5432/investment_platform

# Test Redis connection
kubectl run -it --rm debug --image=redis:7-alpine --restart=Never -n investment-platform -- redis-cli -h redis -a redis_pass ping
```

### Health Checks

All services include comprehensive health checks:

- **Liveness probes**: Restart unhealthy containers
- **Readiness probes**: Remove unhealthy containers from service
- **Startup probes**: Handle slow-starting containers

## Production Considerations

### Before Production Deployment

1. **Update all default secrets** with strong, randomly generated values
2. **Configure persistent storage** with appropriate storage classes
3. **Set up backup procedures** for PostgreSQL data
4. **Configure monitoring alerts** in Prometheus/Grafana
5. **Review and adjust resource limits** based on expected load
6. **Set up log aggregation** (e.g., ELK stack, Fluentd)
7. **Configure network policies** for your security requirements
8. **Set up CI/CD pipelines** for automated deployments

### Scaling Considerations

- **Database scaling**: Consider PostgreSQL read replicas for high read loads
- **Cache scaling**: Consider Redis clustering for high cache loads
- **Service scaling**: HPA will handle automatic scaling based on CPU/memory
- **Storage scaling**: Use dynamic provisioning with storage classes that support expansion

### Backup and Recovery

Implement backup strategies:

```bash
# Database backup example
kubectl create job --from=cronjob/postgres-backup postgres-backup-manual -n investment-platform

# Persistent volume backup
# Use your cloud provider's volume snapshot feature
```

This Kubernetes configuration provides a production-ready foundation for the Investment Platform with comprehensive monitoring, security, and scalability features.