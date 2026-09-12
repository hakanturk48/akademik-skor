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

GitHub Pages statik frontend yayınlar. Firebase yapılandırıldığında kullanıcı doğrulama, admin rol kontrolü ve merkezi içerik verisi cihazdan bağımsız çalışır. Firebase değişkenleri yoksa uygulama yalnızca yerel demo fallback moduna döner.

## Kalıcı üyelik ve Firebase kurulumu

Üyelikler Firebase Authentication, profil/rol bilgileri ve yayınlanan içerik snapshot'ları Firestore üzerinde kalıcı tutulur. Şu an canlı akışta yalnızca YouTube/Vimeo video bağlantıları desteklenir; bilgisayardan video dosyası yükleme Storage/domain taşıma aşamasına bırakılmıştır.

1. Firebase Console içinde bir proje ve Web App oluşturun.
2. Authentication > Sign-in method bölümünde Email/Password sağlayıcısını etkinleştirin.
3. Authentication > Settings > Authorized domains bölümünde `localhost` ve `hakanturk48.github.io` alan adlarını izinli bırakın/ekleyin.
4. Firestore Database oluşturun ve Rules sekmesine `firestore.rules` içeriğini yayınlayın.
5. Firebase Web App config değerlerini `.env.local` içine `.env.example` şablonuyla ekleyin.
6. GitHub repository > Settings > Secrets and variables > Actions bölümünde şu repository secrets değerlerini oluşturun: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`.
7. İlk admin kullanıcı hesabını normal kayıtla oluşturduktan sonra Firebase Console > Firestore içinde ilgili `profiles/{uid}` belgesindeki `role` alanını `admin` yapın.

Firebase CLI kullanıyorsanız Firestore kurallarını tek komutla yayınlayabilirsiniz:

```bash
firebase deploy --only firestore:rules
```

LocalStorage'da daha önce oluşturulmuş demo hesaplar merkezi üyelik sistemine otomatik taşınamaz. Firebase yapılandırması etkinleştirildikten sonra yeni kayıtlar cihazdan bağımsız kalıcı olur.

### Merkezi admin içerik ve video yayınları

Admin panelindeki video dersler Firebase yapılandırıldığında `adminWorkspaces/main` Firestore belgesine kaydedilir. Yayına alınan içerikler ayrıca `publishedContentSnapshots/main` belgesine yazılır; öğrenci video listesi ve video detay sayfası bu public snapshot üzerinden başka tarayıcı ve bilgisayarlarda aynı yayınlanmış videoları gösterir.

- GitHub Actions secrets içinde Firebase public config değerleri tanımlı olmalıdır. Yerelde aynı değerleri `.env.local` içine `.env.example` şablonuyla ekleyin.
- Eski tarayıcıda localStorage'a kaydedilmiş admin videoları kaybetmemek için yeni sürüm yayınlandıktan sonra önce videoların göründüğü tarayıcıdan admin paneline girin. Uygulama yerel admin workspace revizyonu merkezi kayıttan yeniyse onu Firestore'a aktarır.
- Canlı sitede öğrenci Video Lessons listesi Firestore'daki yayınlanmış katalogdan beslenir. Demo video seed verileri yalnızca Firebase yapılandırması olmayan lokal geliştirme/fallback modunda görünür.
- YouTube/Vimeo bağlantılı videolar Firestore katalog kaydıyla tüm cihazlarda görünür.
- Bilgisayardan video dosyası yükleme şu an canlı akışta kapalıdır; Firebase Storage ve alan adı taşıma aşamasında yeniden açılacaktır.
