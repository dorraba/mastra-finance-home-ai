# 🚀 Environment Setup Guide

This guide will help you set up the Mastra Finance AI project for local development using SQLite for vector storage.

## 📋 **Quick Setup**

### **1. Environment Variables**

Create a `.env` file in your project root:

```bash
# OPENAI CONFIGURATION (Required)
OPENAI_API_KEY=your_openai_api_key_here

# VECTOR STORAGE CONFIGURATION
# Values: "sqlite" | "mock" | "auto"
VECTOR_STORAGE_MODE=sqlite

# OPTIONAL: Override the default AI model
MODEL=gpt-4o
```

### **2. OpenAI API Key**

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key and add it to your `.env` file

## 🏗️ **Vector Storage Modes**

The application supports different vector storage modes:

- **SQLite Mode** (`VECTOR_STORAGE_MODE=sqlite`): Uses local SQLite database for vector storage
- **Mock Mode** (`VECTOR_STORAGE_MODE=mock`): Uses in-memory mock provider for testing
- **Auto Mode** (`VECTOR_STORAGE_MODE=auto`): Automatically chooses SQLite as the preferred option

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"No embedding generated" errors**
   - Check your `OPENAI_API_KEY` is set correctly
   - Ensure you have sufficient OpenAI API credits

2. **Database errors**
   - The SQLite database will be created automatically in the `data/` directory
   - Make sure the application has write permissions to create files

## 🧪 **Testing Your Setup**

Once you have your environment configured:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will:
- Create a local SQLite database automatically
- Use OpenAI for transaction analysis and embeddings
- Store all data locally for development

## 📚 **Next Steps**

1. 🔑 Set up your API key (OpenAI)
2. 🚀 Run `npm run dev` to start developing
3. 🧪 Test transaction analysis in the Mastra playground
4. 📊 Explore vector search functionality

Your setup is complete! The application will use SQLite for reliable local vector storage and OpenAI for intelligent transaction analysis. 