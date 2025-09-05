# Product Description Generator

This project is a Node.js application that generates product descriptions using the GPT-5 Nano model. It takes input from brand phrases, product tags, and images to create compelling descriptions for various products.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/product-description-generator.git
   ```

2. Navigate to the project directory:
   ```
   cd product-description-generator
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Add .env file:
    Add a .env file to the main folder and add the following:
    ```
    OPENAI_API_KEY='YOUR_GPT_API_KEY'
    ```

## Usage

1. Edit the phrases you want to use a base brand prompts in ``` /src/brandPhrases.js ```
    Example:
    ```
    export const brandPhrases = [
      "Elevating Everyday Style",
      "Crafted with Care",
      "Designed for Modern Living"
    ];
    ```

2. Edit GPT Prompt in ``` /src/prompts.js ```

3. Add ``` input.csv ``` file into base folder

4. Start the application: 
    run the following command:
    ```
    npm run generate
    ```

5. Get the new csv file:
    The new file will be located in the base folder labeled as
    ```
    output.csv
    ``` 


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.