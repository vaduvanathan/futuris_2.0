import os
from google import genai
from google.genai import types
from typing import List, Optional, Any

class Agent:
    def __init__(
        self, 
        name: str, 
        model: str, 
        system_instruction: str, 
        tools: Optional[List[Any]] = None,
        generation_config: Optional[Any] = None
    ):
        self.name = name
        self.model = model
        self.system_instruction = system_instruction
        self.tools = tools
        self.generation_config = generation_config
        
        # Initialize the client
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            # Fallback: try loading .env if not already loaded
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.environ.get("GOOGLE_API_KEY")
            
        if not api_key:
            print(f"Warning: GOOGLE_API_KEY not found for agent {name}. Agent may fail to generate.")
            raise ValueError("GOOGLE_API_KEY not found. Please set it in the environment variables.")
            
        self.client = genai.Client(api_key=api_key)

    def generate(self, prompt: str, context: Optional[List[Any]] = None) -> str:
        """Generates a response from the agent."""
        
        try:
            # Prepare config
            # If generation_config is provided, use it. Otherwise create a new one.
            # We assume generation_config is a dict or compatible object.
            if self.generation_config:
                if isinstance(self.generation_config, dict):
                    config = types.GenerateContentConfig(**self.generation_config)
                else:
                    config = self.generation_config
            else:
                config = types.GenerateContentConfig()
            
            # Set system instruction
            if self.system_instruction:
                config.system_instruction = self.system_instruction
                
            # Set tools
            if self.tools:
                config.tools = self.tools

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )
            
            return response.text
        except Exception as e:
            return f"Error generating response for {self.name}: {str(e)}"
