FROM  ubuntu:24.04

WORKDIR /workspace

# Install necessary basic packages
RUN apt-get update && apt-get install -y \
    build-essential \
    clang \
    git \
    zip \
    unzip \
    tree \
    ccache \
    screen \
    vim \
    wget \
    curl \
    libssl-dev \
    gnupg \
    pkg-config \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install nodejs(v21.7.3) & yarn
RUN curl -fsSL https://deb.nodesource.com/setup_21.x | bash - && \
  apt-get install -y nodejs && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt-get update && apt-get install -y yarn=1.22.22-1

# Copy all the stffus into image
COPY . .

# Resolve dependencies listed in package.json and build
RUN npm install && npm run build

# Run duckdb-wasm app server
ENTRYPOINT ["npm", "run", "start"]
