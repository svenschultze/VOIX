# Angular-Integrationshandbuch

> [!CAUTION]
> Dieses Handbuch ist ungetestet und kann Fehler enthalten. Bitte überprüfen Sie die Codebeispiele in Ihrer eigenen Implementierung und melden Sie alle Probleme.

Dieses Handbuch behandelt Muster und bewährte Verfahren für die Integration von VOIX in Angular-Anwendungen, einschließlich Werkzeugen auf Komponentenebene, Zustandsmanagement und Angular-spezifischen Optimierungen.

## Konfiguration

### Modulkonfiguration

Fügen Sie Ihrem Modul `CUSTOM_ELEMENTS_SCHEMA` hinzu, um benutzerdefinierte Elemente zu ermöglichen:

```typescript
// app.module.ts oder das Modul Ihrer Komponente
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ... andere Konfiguration
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
```

### Globale Stile

Fügen Sie diese Stile hinzu, um VOIX-Elemente in der Benutzeroberfläche auszublenden:

```css
/* styles.css oder globale Stile */
tool, prop, context, array, dict {
  display: none;
}
```

## Werkzeuge auf Komponentenebene

Definieren Sie Werkzeuge auf Komponentenebene für eine bessere Kapselung:

```typescript
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile">
      <h2>Profil von {{ user.name }}</h2>
      
      <!-- Komponentenspezifische Werkzeuge -->
      <tool 
        #updateTool
        [attr.name]="'update_' + userId + '_profile'"
        description="Profil dieses Benutzers aktualisieren"
      >
        <prop name="field" type="string" required description="name, email oder bio"></prop>
        <prop name="value" type="string" required></prop>
      </tool>
      
      <tool 
        #notificationTool
        [attr.name]="'toggle_' + userId + '_notifications'"
        description="E-Mail-Benachrichtigungen umschalten"
      >
      </tool>
      
      <!-- Komponentenkontext mit mehreren Werten -->
      <context [attr.name]="'user_' + userId + '_state'">
        Name: {{ user.name }}
        E-Mail: {{ user.email }}
        Bio: {{ user.bio }}
        Benachrichtigungen: {{ user.notifications ? 'Aktiviert' : 'Deaktiviert' }}
      </context>
      
      <!-- Reguläre Benutzeroberfläche -->
      <div class="profile-details">
        <p>E-Mail: {{ user.email }}</p>
        <p>Bio: {{ user.bio }}</p>
        <p>Benachrichtigungen: {{ user.notifications ? 'An' : 'Aus' }}</p>
      </div>
    </div>
  `
})
export class UserProfileComponent implements OnInit, OnDestroy {
  @Input() userId!: string;
  @ViewChild('updateTool') updateTool!: ElementRef;
  @ViewChild('notificationTool') notificationTool!: ElementRef;

  user = {
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Softwareentwickler',
    notifications: true
  };

  private updateHandler = this.handleUpdateProfile.bind(this);
  private notificationHandler = this.handleToggleNotifications.bind(this);

  ngOnInit() {
    // Event-Listener werden in ngAfterViewInit angehängt
  }

  ngAfterViewInit() {
    if (this.updateTool) {
      this.updateTool.nativeElement.addEventListener('call', this.updateHandler);
    }
    if (this.notificationTool) {
      this.notificationTool.nativeElement.addEventListener('call', this.notificationHandler);
    }
  }

  ngOnDestroy() {
    if (this.updateTool) {
      this.updateTool.nativeElement.removeEventListener('call', this.updateHandler);
    }
    if (this.notificationTool) {
      this.notificationTool.nativeElement.removeEventListener('call', this.notificationHandler);
    }
  }

  private handleUpdateProfile(event: any) {
    const { field, value } = event.detail;
    
    if (field in this.user) {
      (this.user as any)[field] = value;
      event.detail.success = true;
      event.detail.message = `${field} auf ${value} aktualisiert`;
    } else {
      event.detail.success = false;
      event.detail.error = `Ungültiges Feld: ${field}`;
    }
  }

  private handleToggleNotifications(event: any) {
    this.user.notifications = !this.user.notifications;
    event.detail.success = true;
    event.detail.message = `Benachrichtigungen ${this.user.notifications ? 'aktiviert' : 'deaktiviert'}`;
  }
}
```

## Fortgeschrittene Muster

### Eindeutige Werkzeugnamen

Werkzeuge müssen in Ihrer gesamten Anwendung eindeutige Namen haben. Wenn Sie mehrere Instanzen derselben Komponente verwenden, fügen Sie einen Bezeichner hinzu:

```typescript
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-product-card',
  template: `
    <div class="product-card">
      <!-- Produkt-ID in den Werkzeugnamen aufnehmen, um Eindeutigkeit zu gewährleisten -->
      <tool 
        #addToCartTool
        [attr.name]="'add_to_cart_' + product.id"
        description="Dieses Produkt zum Warenkorb hinzufügen"
      >
        <prop name="quantity" type="number" required></prop>
      </tool>
      
      <tool 
        #toggleFavoriteTool
        [attr.name]="'toggle_favorite_' + product.id"
        description="Favoritenstatus umschalten"
      >
      </tool>
      
      <h3>{{ product.name }}</h3>
      <button (click)="addToCart()">Zum Warenkorb hinzufügen</button>
    </div>
  `
})
export class ProductCardComponent implements AfterViewInit, OnDestroy {
  @Input() product!: { id: string; name: string };
  @ViewChild('addToCartTool') addToCartTool!: ElementRef;
  @ViewChild('toggleFavoriteTool') toggleFavoriteTool!: ElementRef;

  private addToCartHandler = this.handleAddToCart.bind(this);
  private toggleFavoriteHandler = this.handleToggleFavorite.bind(this);

  ngAfterViewInit() {
    if (this.addToCartTool) {
      this.addToCartTool.nativeElement.addEventListener('call', this.addToCartHandler);
    }
    if (this.toggleFavoriteTool) {
      this.toggleFavoriteTool.nativeElement.addEventListener('call', this.toggleFavoriteHandler);
    }
  }

  ngOnDestroy() {
    if (this.addToCartTool) {
      this.addToCartTool.nativeElement.removeEventListener('call', this.addToCartHandler);
    }
    if (this.toggleFavoriteTool) {
      this.toggleFavoriteTool.nativeElement.removeEventListener('call', this.toggleFavoriteHandler);
    }
  }

  private handleAddToCart(event: any) {
    const { quantity } = event.detail;
    // Logik zum Hinzufügen zum Warenkorb
    event.detail.success = true;
    event.detail.message = `${quantity} zum Warenkorb hinzugefügt`;
  }

  private handleToggleFavorite(event: any) {
    // Logik zum Umschalten des Favoritenstatus
    event.detail.success = true;
  }

  addToCart() {
    // Regulärer Button-Klick-Handler
  }
}
```

### Bedingte Werkzeugverfügbarkeit

Zeigen Sie Werkzeuge basierend auf Benutzerberechtigungen an:

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div>
      <!-- Admin-Werkzeuge nur für Admins sichtbar -->
      <tool 
        *ngIf="userService.isAdmin"
        #deleteUsersTool
        name="delete_users" 
        description="Ausgewählte Benutzer löschen"
      >
        <prop name="userIds" type="array" required></prop>
      </tool>
      
      <!-- Für alle Benutzer verfügbar -->
      <tool 
        #exportDataTool
        name="export_data" 
        description="Ihre Daten exportieren"
      >
        <prop name="format" type="string" description="csv oder json"></prop>
      </tool>
      
      <context name="permissions">
        Rolle: {{ userService.role }}
        Admin: {{ userService.isAdmin ? 'Ja' : 'Nein' }}
      </context>
    </div>
  `
})
export class AdminPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('deleteUsersTool') deleteUsersTool?: ElementRef;
  @ViewChild('exportDataTool') exportDataTool!: ElementRef;

  private deleteUsersHandler = this.handleDeleteUsers.bind(this);
  private exportDataHandler = this.handleExportData.bind(this);

  constructor(public userService: UserService) {}

  ngAfterViewInit() {
    if (this.deleteUsersTool && this.userService.isAdmin) {
      this.deleteUsersTool.nativeElement.addEventListener('call', this.deleteUsersHandler);
    }
    if (this.exportDataTool) {
      this.exportDataTool.nativeElement.addEventListener('call', this.exportDataHandler);
    }
  }

  ngOnDestroy() {
    if (this.deleteUsersTool) {
      this.deleteUsersTool.nativeElement.removeEventListener('call', this.deleteUsersHandler);
    }
    if (this.exportDataTool) {
      this.exportDataTool.nativeElement.removeEventListener('call', this.exportDataHandler);
    }
  }

  private handleDeleteUsers(event: any) {
    const { userIds } = event.detail;
    // Logik zum Löschen von Benutzern
    event.detail.success = true;
    event.detail.message = `${userIds.length} Benutzer gelöscht`;
  }

  private handleExportData(event: any) {
    const { format } = event.detail;
    // Logik zum Exportieren von Daten
    event.detail.success = true;
  }
}
```

### Echtzeit-Updates

Aktualisieren Sie den Kontext automatisch, wenn sich Daten ändern:

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <!-- Kontext wird automatisch mit Eigenschaftsänderungen aktualisiert -->
      <context name="metrics">
        Benutzer online: {{ onlineUsers }}
        Letztes Update: {{ lastUpdate }}
      </context>
      
      <tool 
        #refreshDataTool
        name="refresh_data" 
        description="Dashboard-Daten aktualisieren"
      >
      </tool>
      
      <div>
        <h3>Dashboard</h3>
        <p>Benutzer Online: {{ onlineUsers }}</p>
        <p>Letztes Update: {{ lastUpdate }}</p>
      </div>
    </div>
  `
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('refreshDataTool') refreshDataTool!: ElementRef;

  onlineUsers = 0;
  lastUpdate = new Date().toLocaleTimeString();
  private interval?: number;
  private refreshHandler = this.handleRefresh.bind(this);

  ngAfterViewInit() {
    if (this.refreshDataTool) {
      this.refreshDataTool.nativeElement.addEventListener('call', this.refreshHandler);
    }

    // Echtzeit-Updates simulieren
    this.interval = window.setInterval(() => {
      this.onlineUsers = Math.floor(Math.random() * 100);
      this.lastUpdate = new Date().toLocaleTimeString();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.refreshDataTool) {
      this.refreshDataTool.nativeElement.removeEventListener('call', this.refreshHandler);
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private handleRefresh(event: any) {
    this.onlineUsers = Math.floor(Math.random() * 100);
    this.lastUpdate = new Date().toLocaleTimeString();
    event.detail.success = true;
    event.detail.message = 'Daten aktualisiert';
  }
}
```

## Testen

Erstellen Sie Test-Dienstprogramme für VOIX-Werkzeuge:

```typescript
// test-utils/voix.ts
export function triggerTool(toolName: string, params: any) {
  const tool = document.querySelector(`[name="${toolName}"]`);
  const event = new CustomEvent('call', {
    detail: { ...params }
  });
  
  tool?.dispatchEvent(event);
  
  return (event as any).detail;
}

// dashboard.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { triggerTool } from './test-utils/voix';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardComponent]
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte das Aktualisierungswerkzeug behandeln', (done) => {
    setTimeout(() => {
      const result = triggerTool('refresh_data', {});
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Daten aktualisiert');
      
      // Überprüfen, ob der Kontext aktualisiert wurde
      const context = document.querySelector('[name="metrics"]');
      expect(context?.textContent).toContain('Benutzer online:');
      done();
    }, 100);
  });
});
```

Dieses Handbuch behandelt die wesentlichen Muster für die Integration von VOIX in Angular-Anwendungen, wobei der Schwerpunkt auf praktischen Beispielen und sauberen Codierungspraktiken liegt.



<!--@include: @/voix_context.md -->