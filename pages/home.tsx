import * as React from 'react';


export interface HomePageState {

}

export class HomePage extends React.Component<any, Partial<HomePageState>> {
    public state: HomePageState = {

    }

    public render() {
        return (
            <section id="home">
                {`This is the home page. Punches will show here.`}
            </section>
        )
    }
}

export default HomePage