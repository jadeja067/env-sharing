import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  form: FormGroup;
  types: Array<string> = []
  isLoading: boolean = false
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = fb.group({
      key: ['', [Validators.required]],
      value: ['', [Validators.required]],
      type: ['', [Validators.required]],
    });
  }
  async ngOnInit(): Promise<void> {
    const data: any = await this.http.get('http://localhost:3300').toPromise()
    this.types = data
    this.form.value.type = this.types[0];
    
  }

  async submit(): Promise<void> {
    this.isLoading = true;
    const payload: any = {}
    payload[this.form.value.key] = this.form.value.value    
    const data: any = await this.http.post(`http://localhost:3300/${this.form.value.type}`, payload).toPromise()
    console.log(data);
    this.form.reset();
    this.isLoading = false;
  }
}
