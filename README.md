# 🚗 RoadMate

### A Modern Full-Stack Web Application for Smarter Road Travel

RoadMate is a modern web application built with **Next.js and TypeScript**, designed to provide a smooth and intuitive experience for road-travel planning and management.

The project combines a modern frontend architecture with backend services, database integration, reusable UI components, and automated testing to create a production-oriented web application.

---

## ✨ Highlights

* ⚡ Built with **Next.js**
* 🔷 Developed with **TypeScript**
* 🎨 Modern and responsive user interface
* 🗄️ **Supabase** integration
* 🧩 Reusable component-based architecture
* 🔐 Environment-based configuration
* 🧪 Automated testing with **Playwright**
* 📱 Responsive web experience
* 🚀 Production-ready Next.js architecture

---

## 🛠️ Tech Stack

| Technology       | Purpose                     |
| ---------------- | --------------------------- |
| **Next.js**      | Full-stack React framework  |
| **React**        | User interface              |
| **TypeScript**   | Type-safe development       |
| **Supabase**     | Backend / database services |
| **Tailwind CSS** | Styling and responsive UI   |
| **Playwright**   | End-to-end testing          |
| **ESLint**       | Code quality and linting    |
| **Vercel**       | Deployment                  |

---

## 🏗️ Project Structure

```text
RoadMate/
│
├── app/                    # Next.js application routes and pages
├── components/             # Reusable UI components
├── context/                # Application state and contexts
├── lib/                    # Utilities and application logic
├── public/                 # Static assets
├── supabase/               # Supabase configuration and resources
├── types/                  # TypeScript type definitions
│
├── tests/                  # Automated tests
├── playwright-report/      # Playwright test reports
│
├── package.json            # Project dependencies and scripts
├── next.config.ts         # Next.js configuration
├── playwright.config.ts   # Playwright configuration
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

* **Node.js 18+**
* npm, pnpm, yarn, or Bun
* A Supabase project if backend functionality requires it

---

## 📥 Installation

Clone the repository:

```bash
git clone https://github.com/nithinkprem/roadmate.git
cd roadmate
```

Install dependencies:

```bash
npm install
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root and add the required environment variables.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Do not commit `.env.local` or expose API keys and credentials in the repository.

---

# 💻 Run Locally

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The application will automatically reload when you make changes.

---

# 🧪 Testing

RoadMate includes automated testing using **Playwright**.

Run the test suite with:

```bash
npx playwright test
```

Run tests with the browser UI:

```bash
npx playwright test --ui
```

Generate or view the Playwright report:

```bash
npx playwright show-report
```

---

# 🧹 Code Quality

Run the linter:

```bash
npm run lint
```

Build the application for production:

```bash
npm run build
```

Start the production build:

```bash
npm start
```

---

# 🏛️ Architecture

RoadMate follows a modern full-stack Next.js architecture:

```text
                    ┌──────────────────────┐
                    │      User / Browser  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Next.js App     │
                    │                      │
                    │  Pages / Components  │
                    │  Server / Client UI  │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
             ┌──────────────┐      ┌──────────────┐
             │ Application  │      │   Supabase   │
             │    Logic     │      │   Backend    │
             └──────────────┘      └──────────────┘
                    │
                    ▼
             ┌──────────────┐
             │   Playwright │
             │    Testing   │
             └──────────────┘
```

---

# 🎯 Project Goals

RoadMate was developed to explore and demonstrate modern web application development using:

* Full-stack Next.js architecture
* Type-safe development with TypeScript
* Modern component-driven UI development
* Backend integration with Supabase
* Automated end-to-end testing
* Production-oriented project structure

---

# 🔮 Future Improvements

Potential improvements include:

* [ ] Enhanced travel-planning functionality
* [ ] Improved user experience and personalization
* [ ] Additional Supabase-backed features
* [ ] More comprehensive test coverage
* [ ] Performance optimization
* [ ] Progressive Web App support
* [ ] Mobile-focused improvements
* [ ] Additional integrations

---

# 🚀 Deployment

The application can be deployed using **Vercel**.

Build the project locally first:

```bash
npm run build
```

Then deploy through Vercel or connect the GitHub repository to your Vercel account.

For more information:

https://vercel.com/

---

# 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Commit your changes:

```bash
git commit -m "Add your feature"
```

5. Push the branch:

```bash
git push origin feature/your-feature
```

6. Open a Pull Request.

---

# 👨‍💻 Author

**Nithin K Prem**

GitHub: [@nithinkprem](https://github.com/nithinkprem)

---

## ⭐ Support

If you find RoadMate interesting, consider giving the repository a ⭐ on GitHub.

> **RoadMate — Built with Next.js, TypeScript, and modern full-stack web technologies.**
