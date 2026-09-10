# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Web yayınlama

Bu proje GitHub Pages için Expo Router'ın static web export çıktısını kullanır. `main` dalına yapılan her push, `.github/workflows/deploy-pages.yml` workflow'u ile otomatik olarak yayınlanır.

Yerel production export:

```bash
npm ci
npm run lint
npx tsc --noEmit
EXPO_BASE_URL=akademik-skor npx expo export --platform web
```

GitHub repository ayarlarında **Settings > Pages > Build and deployment > Source** değeri **GitHub Actions** olmalıdır. Repository Pages adresi:

`https://hakanturk48.github.io/akademik-skor/`

GitHub Pages yalnızca statik frontend önizlemesidir. Gerçek kullanıcı doğrulama, admin rol kontrolü, merkezi içerik verisi ve medya storage sonraki backend aşamasında kurulacaktır.

## Kalıcı üyelik ve Supabase kurulumu

Üyelikler yapılandırılmış Supabase Auth ve PostgreSQL profilleri üzerinden kalıcı tutulur. Supabase değişkenleri yoksa uygulama yalnızca yerel demo auth fallback'i kullanır; bu mod gerçek hesap sistemi değildir.

1. Supabase'te bir proje oluşturun.
2. SQL Editor'da `supabase/schema.sql` dosyasını çalıştırın.
3. Authentication > URL Configuration bölümünde önce `http://localhost:8092`, sonra GitHub Pages adresini ve ileride kullanılacak özel domaini izinli URL olarak ekleyin.
4. Project Settings > API içinden Project URL ve `anon public` anahtarını alın. `service_role` anahtarını frontend'e veya GitHub Actions'a koymayın.
5. Yerelde `.env.local` dosyasına `.env.example` içeriğini kopyalayıp değerleri doldurun.
6. GitHub repository > Settings > Secrets and variables > Actions bölümünde şu repository secrets değerlerini oluşturun: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
7. İlk admin kullanıcı hesabını normal kayıtla oluşturduktan sonra Supabase SQL Editor'da yalnızca yetkili hesabı admin yapın:

```sql
update public.profiles set role = 'admin' where email = 'admin@example.com';
```

LocalStorage'da daha önce oluşturulmuş demo hesaplar merkezi veritabanına otomatik taşınamaz. Supabase yapılandırması etkinleştirildikten sonra yeni kayıtlar cihazdan bağımsız kalıcı olur.
