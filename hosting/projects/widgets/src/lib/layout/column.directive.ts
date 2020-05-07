import { Directive, HostBinding } from '@angular/core';

@Directive({
    selector: '[widgetColumn]',
})
export class WidgetColumnDirective {

    @HostBinding('style.display')
    private display = 'flex';

    @HostBinding('style.flexDirection')
    private direction = 'column';

    @HostBinding('style.flex')
    private flex = 1;

}
