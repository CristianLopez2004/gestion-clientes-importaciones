FROM mcr.microsoft.com/azure-functions/node:4-node20
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_WORKER_RUNTIME=node
COPY package*.json /home/site/wwwroot/
RUN cd /home/site/wwwroot && npm install --omit=dev
COPY . /home/site/wwwroot
