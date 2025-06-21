import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { weatherWorkflow } from './workflows';
import { weatherAgent, accountStatementAnalyzerAgent } from './agents';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { 
    weatherAgent,
    accountStatementAnalyzerAgent 
  },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

// Expose the Mastra instance globally for logger access
(globalThis as any).mastra = mastra;
