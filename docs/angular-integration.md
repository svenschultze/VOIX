# Angular Integration Guide

> [!CAUTION]
> This guide is untested and may contain errors. Please verify the code examples in your own implementation and report any issues.

This guide covers patterns and best practices for integrating VOIX with Angular applications, including component-level tools, state management, and Angular-specific optimizations.

## Configuration

### Module Configuration

Add CUSTOM_ELEMENTS_SCHEMA to your module to allow custom elements:

```typescript
// app.module.ts or your component's module
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ... other configuration
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
```

### Global Styles

Add these styles to hide VOIX elements from the UI:

```css
/* styles.css or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Component-Level Tools

Define tools at the component level for better encapsulation:

```typescript
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile">
      <h2>{{ user.name }}'s Profile</h2>
      
      <!-- Component-specific tools -->
      <tool 
        #updateTool
        [attr.name]="'update_' + userId + '_profile'"
        description="Update this user's profile"
      >
        <prop name="field" type="string" required description="name, email, or bio"></prop>
        <prop name="value" type="string" required></prop>
      </tool>
      
      <tool 
        #notificationTool
        [attr.name]="'toggle_' + userId + '_notifications'"
        description="Toggle email notifications"
      >
      </tool>
      
      <!-- Component context with multiple values -->
      <context [attr.name]="'user_' + userId + '_state'">
        Name: {{ user.name }}
        Email: {{ user.email }}
        Bio: {{ user.bio }}
        Notifications: {{ user.notifications ? 'Enabled' : 'Disabled' }}
      </context>
      
      <!-- Regular UI -->
      <div class="profile-details">
        <p>Email: {{ user.email }}</p>
        <p>Bio: {{ user.bio }}</p>
        <p>Notifications: {{ user.notifications ? 'On' : 'Off' }}</p>
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
    bio: 'Software developer',
    notifications: true
  };

  private updateHandler = this.handleUpdateProfile.bind(this);
  private notificationHandler = this.handleToggleNotifications.bind(this);

  ngOnInit() {
    // Event listeners are attached in ngAfterViewInit
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
      event.detail.message = `Updated ${field} to ${value}`;
    } else {
      event.detail.success = false;
      event.detail.error = `Invalid field: ${field}`;
    }
  }

  private handleToggleNotifications(event: any) {
    this.user.notifications = !this.user.notifications;
    event.detail.success = true;
    event.detail.message = `Notifications ${this.user.notifications ? 'enabled' : 'disabled'}`;
  }
}
```

## Advanced Patterns

### Unique Tool Names

Tools must have unique names across your application. When using multiple instances of the same component, include an identifier:

```typescript
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-product-card',
  template: `
    <div class="product-card">
      <!-- Include product ID in tool name to ensure uniqueness -->
      <tool 
        #addToCartTool
        [attr.name]="'add_to_cart_' + product.id"
        description="Add this product to cart"
      >
        <prop name="quantity" type="number" required></prop>
      </tool>
      
      <tool 
        #toggleFavoriteTool
        [attr.name]="'toggle_favorite_' + product.id"
        description="Toggle favorite status"
      >
      </tool>
      
      <h3>{{ product.name }}</h3>
      <button (click)="addToCart()">Add to Cart</button>
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
    // Add to cart logic
    event.detail.success = true;
    event.detail.message = `Added ${quantity} to cart`;
  }

  private handleToggleFavorite(event: any) {
    // Toggle favorite logic
    event.detail.success = true;
  }

  addToCart() {
    // Regular button click handler
  }
}
```

### Conditional Tool Availability

Show tools based on user permissions:

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div>
      <!-- Admin tools only visible to admins -->
      <tool 
        *ngIf="userService.isAdmin"
        #deleteUsersTool
        name="delete_users" 
        description="Delete selected users"
      >
        <prop name="userIds" type="array" required></prop>
      </tool>
      
      <!-- Available to all users -->
      <tool 
        #exportDataTool
        name="export_data" 
        description="Export your data"
      >
        <prop name="format" type="string" description="csv or json"></prop>
      </tool>
      
      <context name="permissions">
        Role: {{ userService.role }}
        Admin: {{ userService.isAdmin ? 'Yes' : 'No' }}
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
    // Delete users logic
    event.detail.success = true;
    event.detail.message = `Deleted ${userIds.length} users`;
  }

  private handleExportData(event: any) {
    const { format } = event.detail;
    // Export data logic
    event.detail.success = true;
  }
}
```

### Real-Time Updates

Update context automatically when data changes:

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <!-- Context updates automatically with property changes -->
      <context name="metrics">
        Users online: {{ onlineUsers }}
        Last update: {{ lastUpdate }}
      </context>
      
      <tool 
        #refreshDataTool
        name="refresh_data" 
        description="Refresh dashboard data"
      >
      </tool>
      
      <div>
        <h3>Dashboard</h3>
        <p>Users Online: {{ onlineUsers }}</p>
        <p>Last Update: {{ lastUpdate }}</p>
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

    // Simulate real-time updates
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
    event.detail.message = 'Data refreshed';
  }
}
```

## Testing

Create test utilities for VOIX tools:

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

  it('should handle refresh tool', (done) => {
    setTimeout(() => {
      const result = triggerTool('refresh_data', {});
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Data refreshed');
      
      // Check if context updated
      const context = document.querySelector('[name="metrics"]');
      expect(context?.textContent).toContain('Users online:');
      done();
    }, 100);
  });
});
```

This guide covers the essential patterns for integrating VOIX with Angular applications, focusing on practical examples and clean code practices.



<!--@include: @/voix_context.md -->