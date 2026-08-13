FROM nginx:latest

# Copy static files to nginx web root
COPY . /usr/share/nginx/html/

# Remove the default nginx config (optional, if needed)
RUN rm /etc/nginx/conf.d/default.conf || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
