import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-type',
  templateUrl: './type.component.html',
  styleUrls: ['./type.component.scss'],
})
export class TypeComponent implements OnInit {
  form: FormGroup;
  isLoading: boolean = false;
  type: string = '';
  data: Array<string> = [];
  types: Array<string> = [];
  idCreating: boolean = false;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.form = fb.group({
      key: ['', [Validators.required]],
      value: ['', [Validators.required]],
      type: ['', [Validators.required]],
    });
  }

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe((params) => (this.type = params?.id || ''));
    await this.fetchENv();
    const data: any = await this.http.get('http://localhost:3300').toPromise();
    this.types = data;
    this.form.controls['type'].setValue(this.type || this.types[0]);
  }
  async fetchENv() {
    if (this.type == '') return;
    const { data }: any = await this.http
      .get(`http://localhost:3300/${this.type}`)
      .toPromise();
    this.data = data;
  }
  get getData() {
    return Object.entries(this.data);
  }
  async update(id: string) {
    this.form.controls['key'].setValue(id);
    this.form.controls['value'].setValue(this.data[id as any]);
    this.form.controls['type'].setValue(this.type);
    this.openModel();
    await this.fetchENv();
  }
  async remove(id: string) {
    if (this.type == '') return;
    await this.http
      .delete(`http://localhost:3300/${this.type}?key=${id}`)
      .toPromise();
    
    await this.fetchENv();
  }
  openModel() {
    this.idCreating = !this.idCreating;
  }
  async submit(): Promise<void> {
    this.isLoading = true;
    const payload: any = {};
    payload[this.form.value.key] = this.form.value.value;
    const data: any = await this.http
      .post(`http://localhost:3300/${this.form.value.type}`, payload)
      .toPromise();
    console.log(data);
    this.form.reset();
    this.isLoading = false;
    this.openModel();
    this.form.reset();
    await this.fetchENv();

  }
}
