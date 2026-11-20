import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
export interface Product {id:number;name:string;category:string;price:number;emoji:string;image?:string;sizes:string[];colors:string[];stock:number;description:string}
export interface User {name:string;email:string;salt:string;hash:string;role:'admin'|'client'}
export interface CartItem {productId:number;size:string;color:string;qty:number}
export interface Order {id:number;email:string;items:CartItem[];total:number;date:string;status:string;address:string}
@Injectable({providedIn:'root'}) export class StoreService {
 private http=inject(HttpClient);
 products:Product[]=[]; users:User[]=[]; cart:CartItem[]=[]; orders:Order[]=[]; currentEmail='';
 private get<T>(key:string,fallback:T):T {try{return JSON.parse(localStorage.getItem('hu_'+key)||'null')??fallback}catch{return fallback}}
 private save(key:string,value:unknown){localStorage.setItem('hu_'+key,JSON.stringify(value))}
 async init(){this.users=this.get('users',[]);this.orders=this.get('orders',[]);this.currentEmail=this.get('session','');this.cart=this.get('cart_'+this.currentEmail,[]);const saved=this.get<Product[]|null>('products',null);if(saved!==null){this.products=saved;try{const defaults=await firstValueFrom(this.http.get<Product[]>('assets/products.json'));const images=new Map(defaults.map(p=>[p.id,p.image]));this.products=this.products.map(p=>({...p,image:p.image||images.get(p.id)||''}));this.save('products',this.products)}catch{}}else {try{this.products=await firstValueFrom(this.http.get<Product[]>('assets/products.json'));this.save('products',this.products)}catch{this.products=[]}}}
 get user(){return this.users.find(u=>u.email===this.currentEmail)}
 get admin(){return this.user?.role==='admin'}
 async digest(password:string,salt:string){const bytes=new TextEncoder().encode(salt+password);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}
 async register(name:string,email:string,password:string){email=email.trim().toLowerCase();if(!name.trim()||!email.includes('@')||password.length<8)throw Error('Nombre, correo válido y contraseña de mínimo 8 caracteres.');if(this.users.some(u=>u.email===email))throw Error('El correo ya está registrado.');const salt=crypto.randomUUID();const role=this.users.length===0?'admin':'client';this.users.push({name:name.trim(),email,salt,hash:await this.digest(password,salt),role});this.save('users',this.users);this.loginAs(email);return role}
 async login(email:string,password:string){const u=this.users.find(x=>x.email===email.trim().toLowerCase());if(!u||u.hash!==await this.digest(password,u.salt))throw Error('Credenciales incorrectas.');this.loginAs(u.email)}
 private loginAs(email:string){this.currentEmail=email;this.save('session',email);this.cart=this.get('cart_'+email,[])}
 logout(){this.currentEmail='';this.save('session','');this.cart=[]}
 persistCart(){this.save('cart_'+this.currentEmail,this.cart)}
 add(p:Product,size:string,color:string){if(!this.user)throw Error('Inicia sesión para comprar.');const found=this.cart.find(x=>x.productId===p.id&&x.size===size&&x.color===color);const qty=(found?.qty||0)+1;if(qty>p.stock)throw Error('No hay suficientes existencias.');if(found)found.qty=qty;else this.cart.push({productId:p.id,size,color,qty:1});this.persistCart()}
 remove(index:number){this.cart.splice(index,1);this.persistCart()}
 updateQty(index:number,delta:number){const item=this.cart[index],p=this.products.find(x=>x.id===item.productId);if(!item||!p)return;item.qty=Math.min(p.stock,Math.max(0,item.qty+delta));if(item.qty===0)this.cart.splice(index,1);this.persistCart()}
 total(){return this.cart.reduce((sum,x)=>sum+(this.products.find(p=>p.id===x.productId)?.price||0)*x.qty,0)}
 checkout(address:string){if(!this.user)throw Error('Inicia sesión.');if(!address.trim())throw Error('Escribe una dirección de entrega.');if(!this.cart.length)throw Error('El carrito está vacío.');const quantities=new Map<number,number>();for(const x of this.cart){quantities.set(x.productId,(quantities.get(x.productId)||0)+x.qty)}for(const [id,qty] of quantities){const p=this.products.find(x=>x.id===id);if(!p||p.stock<qty)throw Error('Inventario insuficiente para uno de los productos.')}const order:Order={id:Date.now(),email:this.currentEmail,items:this.cart.map(x=>({...x})),total:this.total(),date:new Date().toISOString(),status:'Registrado (simulación)',address:address.trim()};for(const [id,qty] of quantities){this.products.find(x=>x.id===id)!.stock-=qty}this.orders.unshift(order);this.save('orders',this.orders);this.save('products',this.products);this.cart=[];this.persistCart();return order}
 upsert(product:Product){if(!this.admin)throw Error('Acceso restringido.');if(!product.name.trim()||!Number.isFinite(Number(product.price))||Number(product.price)<0||!Number.isInteger(Number(product.stock))||Number(product.stock)<0||!product.sizes.length||!product.colors.length)throw Error('Revisa los datos del producto.');product.price=Number(product.price);product.stock=Number(product.stock);const i=this.products.findIndex(x=>x.id===product.id);if(i>=0)this.products[i]=product;else this.products.push({...product,id:Date.now()});this.save('products',this.products)}
 delete(id:number){if(!this.admin)throw Error('Acceso restringido.');this.products=this.products.filter(x=>x.id!==id);this.save('products',this.products)}
}
