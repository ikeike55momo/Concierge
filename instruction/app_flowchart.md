flowchart TD
A[Start] --> B[Public UI browse ranking and charts]
A --> C[Admin UI login]
C --> D[CSV Upload]
D --> E[Parse CSV with PapaParse]
E --> F[Store raw CSV in Supabase storage]
E --> G[Save daily performance in daily_performance table]
G --> H[Aggregate data into monthly JSON]
H --> I[Upsert aggregated data to Supabase]
I --> J[Nightly batch scoring process]
J --> K[Store scores in store_scores table]
J --> L{LLM service available}
L -->|Claude success| M[Generate comments with Claude API]
L -->|Claude fail| N[Generate comments with OpenAI API]
M --> O[Save generated comments to database]
N --> O
O --> B