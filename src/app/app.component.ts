import { Component, ViewChildren, QueryList } from '@angular/core';
import { Platform, NavController, IonRouterOutlet, ToastController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { TranslateService } from '@ngx-translate/core';
import { EndgameDatabaseService, MiscService, EndgameDatabase, Category, ConfigurationService, ThemeSwitcherService } from './shared';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public initialized = false;
  public endgameDatabase: EndgameDatabase = {
    version: null,
    categories: null
  };
  public prePages = [
    {
      title: 'home',
      url: '/home',
      icon: 'home'
    }
  ];

  postPages = [
    {
      title: 'preferences',
      url: '/preferences',
      icon: 'options'
    },
    {
      title: 'about',
      url: '/about',
      icon: 'help'
    }
  ];

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;
  private lastTimeBackPress = 0;
  private timePeriodToExit = 2000;
  private literals: any;

  constructor(
    private platform: Platform,
    private router: Router,
    private toast: ToastController,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private configurationService: ConfigurationService,
    private miscService: MiscService,
    private navCtrl: NavController,
    private endgameDatabaseService: EndgameDatabaseService,
    private themeSwitcherService: ThemeSwitcherService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use(this.translate.getBrowserLang());
    this.initializeApp();
  }

  private initializeApp() {
    this.platform.backButton.subscribe(async () => {
      this.routerOutlets.forEach(async (outlet: IonRouterOutlet) => {
        this.goBack();
      });
    });
    Promise.all([
      this.configurationService.initialize(),
      this.endgameDatabaseService.initialize(),
      this.platform.ready()
    ]).then((values: any[]) => {
      const config = values[0];
      this.themeSwitcherService.setTheme(config.colorTheme);
      this.translate.get(['app.back-to-exit']).subscribe(async res => {
        this.literals = res;
      });
      const automaticShowFirstPosition = config.automaticShowFirstPosition;
      let goCategory = -1, goSubcategory = -1, goGame = -1;
      let gotoNextPosition = false;
      this.endgameDatabase = this.endgameDatabaseService.getDatabase();
      this.endgameDatabase.categories.forEach((category, idxCategory) => {
        category.selected = false;
        category.subcategories.forEach((subcategory, idxSubcategory) => {
          subcategory.images = this.miscService.textToImages(subcategory.name);
          subcategory.games.forEach((game, idxGame) => {
            if (automaticShowFirstPosition && goCategory == -1 && (!game.record || game.record <= 0)) {
              goCategory = idxCategory;
              goSubcategory = idxSubcategory;
              goGame = idxGame;
              gotoNextPosition = (goCategory > 0 || goSubcategory > 0 || goGame > 0 || (game.record && game.record <= 0));
            }
          });
        });
        if (gotoNextPosition) {
          this.navCtrl.navigateRoot('/position/' + goCategory + '/' + goSubcategory + '/' + goGame);
        }
        this.initialized = true;
        this.splashScreen.hide();
      });
    });
  }

  private async goBack() {
    if (this.router.url === '/home') {
      if (this.lastTimeBackPress !== 0 && new Date().getTime() - this.lastTimeBackPress < this.timePeriodToExit) {
        navigator['app'].exitApp();
      } else {
        const toast = await this.toast.create({
          message: this.literals['app.back-to-exit'],
          position: 'middle',
          color: 'medium',
          duration: this.timePeriodToExit
        });
        toast.present();
        this.lastTimeBackPress = new Date().getTime();
      }
    } else if (this.router.url.startsWith('/list/') ||
      this.router.url === '/preferences' || this.router.url === '/about') {
      this.navCtrl.navigateRoot('/home');
    } else if (this.router.url.startsWith('/position/')) {
      this.navCtrl.navigateRoot(this.router.url.substring(0, this.router.url.lastIndexOf('/')).replace('position', 'list'));
    }
  }

  toggleCategory(category: Category) {
    category.selected = !category.selected;
    this.endgameDatabase.categories.map(item => {
      if (item !== category && item.selected) {
        item.selected = false;
      }
    });
  }

  showList(idxCategory, idxSubcategory) {
    //this.router.navigate(['/list/'+ idxCategory+ '/' + idxSubcategory]);
    this.navCtrl.navigateRoot('/list/' + idxCategory + '/' + idxSubcategory);
  }

  exit() {
    navigator['app'].exitApp();
  }

}
