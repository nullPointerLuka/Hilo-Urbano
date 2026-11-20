import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonApp,IonHeader,IonToolbar,IonTitle,IonContent,IonButton,IonButtons,IonIcon,IonCard,IonCardContent,IonInput,IonItem,IonLabel,IonSelect,IonSelectOption,IonBadge,IonText,IonFooter,IonTabBar,IonTabButton,IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline,personOutline,storefrontOutline,receiptOutline,settingsOutline,logOutOutline,searchOutline } from 'ionicons/icons';
import { StoreService,Product } from './store.service';
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,IonApp,IonHeader,IonToolbar,IonTitle,IonContent,IonButton,IonButtons,IonIcon,IonCard,IonCardContent,IonInput,IonItem,IonLabel,IonSelect,IonSelectOption,IonBadge,IonText,IonFooter,IonTabBar,IonTabButton,IonToast],templateUrl:'./app.component.html'})
export class AppComponent implements OnInit {
 s=inject(StoreService);page='catalog';ready=false;search='';category='Todas';sort='featured';maxPrice=0;onlyAvailable=false;selected:Product|null=null;size='M';color='Negro';address='';name='';email='';password='';authMode:'login'|'register'='login';message='';editing:Product|null=null;
 constructor(){addIcons({cartOutline,personOutline,storefrontOutline,receiptOutline,settingsOutline,logOutOutline,searchOutline})}
 async ngOnInit(){await this.s.init();this.ready=true}
 get filtered(){const list=this.s.products.filter(p=>(this.category==='Todas'||p.category===this.category)&&p.name.toLowerCase().includes(this.search.toLowerCase())&&(!this.onlyAvailable||p.stock>0)&&(!this.maxPrice||p.price<=this.maxPrice));return this.sort==='priceAsc'?list.sort((a,b)=>a.price-b.price):this.sort==='priceDesc'?list.sort((a,b)=>b.price-a.price):this.sort==='name'?list.sort((a,b)=>a.name.localeCompare(b.name)):list}
 get myOrders(){return this.s.orders.filter(o=>o.email===this.s.currentEmail)}
 productName(id:number){return this.s.products.find(p=>p.id===id)?.name||'Producto eliminado'}
 productImage(id:number){return this.s.products.find(p=>p.id===id)?.image||''}
 get stockTotal(){return this.s.products.reduce((n,p)=>n+p.stock,0)}
 productPrice(id:number){return this.s.products.find(p=>p.id===id)?.price||0}
 money(n:number){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)}
 notify(text:string){this.message=text}
 show(p:Product){this.selected=p;this.size=p.sizes[0];this.color=p.colors[0];this.page='detail'}
 add(){if(!this.selected)return;try{this.s.add(this.selected,this.size,this.color);this.notify('Producto agregado al carrito')}catch(e){this.notify((e as Error).message);if(!this.s.user)this.page='account'}}
 async auth(){try{if(this.authMode==='register'){const role=await this.s.register(this.name,this.email,this.password);this.notify(role==='admin'?'Cuenta administradora creada':'Cuenta creada')}else{await this.s.login(this.email,this.password);this.notify('Sesión iniciada')}this.password='';this.page='catalog'}catch(e){this.notify((e as Error).message)}}
 checkout(){try{const order=this.s.checkout(this.address);this.address='';this.notify('Pedido #'+order.id+' registrado (sin cobro real)');this.page='orders'}catch(e){this.notify((e as Error).message)}}
 edit(p?:Product){this.editing=p?{...p,sizes:[...p.sizes],colors:[...p.colors]}:{id:0,name:'',category:'Mujer',price:0,emoji:'👕',image:'',sizes:['S','M','L'],colors:['Negro'],stock:0,description:''};this.page='edit'}
 sizesText(){return this.editing?.sizes.join(', ')||''}
 colorsText(){return this.editing?.colors.join(', ')||''}
 setSizes(s:string){if(this.editing)this.editing.sizes=s.split(',').map(x=>x.trim()).filter(Boolean)}
 setColors(s:string){if(this.editing)this.editing.colors=s.split(',').map(x=>x.trim()).filter(Boolean)}
 saveProduct(){if(!this.editing)return;try{this.s.upsert(this.editing);this.notify('Producto guardado');this.page='admin'}catch(e){this.notify((e as Error).message)}}
 deleteProduct(p:Product){if(confirm('¿Eliminar '+p.name+'?')){this.s.delete(p.id);this.notify('Producto eliminado')}}
 imageError(event:Event){const el=event.target as HTMLImageElement;el.style.display='none';el.parentElement?.classList.add('image-unavailable')}
 logout(){this.s.logout();this.page='catalog';this.notify('Sesión cerrada')}
}
