// Rutas principales de la aplicacion Angular.
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { CoursesComponent } from './features/courses/courses.component';
import { CourseDetailComponent } from './features/courses/course-detail.component';
import { KitsComponent } from './features/kits/kits.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { AccountComponent } from './features/account/account.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'courses', component: CoursesComponent },
	{ path: 'courses/:id', component: CourseDetailComponent },
	{ path: 'kits', component: KitsComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'account', component: AccountComponent, canActivate: [authGuard] },
	{
		path: 'admin',
		component: DashboardComponent,
		canActivate: [authGuard],
		data: { role: 'admin' }
	},
	{ path: '**', redirectTo: '' }
];
