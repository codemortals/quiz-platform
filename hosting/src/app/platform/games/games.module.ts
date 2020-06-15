import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';
import { WidgetsModule } from '@widgets/widgets.module';

import { GameCreateComponent } from './create/create.component';
import { GameLobbyComponent } from './lobby/lobby.component';
import { GamePlayComponent } from './play/play.component';

import { GamesRouting } from './games.routing';

@NgModule({
    declarations: [
        GameCreateComponent,
        GameLobbyComponent,
        GamePlayComponent,
    ],
    imports: [
        CoreModule,
        WidgetsModule,
        GamesRouting,
    ],
})
export class GamesModule {
}
