declare namespace PetStore {
    // Define types for Pet
    interface Pet {
        id: number;
        name: string;
        breed: string;
        age: number;
    }

    // Define types for Order
    interface Order {
        id: number;
        petId: number;
        quantity: number;
        shipDate: Date;
        status: 'placed' | 'approved' | 'delivered';
    }

    // Define types for User
    interface User {
        id: number;
        username: string;
        email: string;
        phone: string;
        address: string;
    }

    // Define types for Category
    interface Category {
        id: number;
        name: string;
    }

    // Define types for Tag
    interface Tag {
        id: number;
        name: string;
    }

    // Define types for ApiResponse
    interface ApiResponse<T> {
        code: number;
        type: string;
        message: T;
    }

    // Define types for requests and responses
    interface AddPetRequest {
        name: string;
        breed: string;
        age: number;
    }

    interface UpdatePetRequest {
        name?: string;
        breed?: string;
        age?: number;
    }

    interface AddOrderRequest {
        petId: number;
        quantity: number;
        shipDate: Date;
    }

    interface CancelOrderRequest {
        petId: number;
    }

    interface UpdateOrderRequest {
        status: 'placed' | 'approved' | 'delivered';
    }

    // Define methods
    interface PetStoreApi {
        addPet(pet: AddPetRequest): Promise<ApiResponse<Pet>>;
        getPetById(petId: number): Promise<ApiResponse<Pet>>;
        updatePet(petId: number, pet: UpdatePetRequest): Promise<ApiResponse<Pet>>;
        deletePet(petId: number): Promise<ApiResponse<{}>>;
        
        addOrder(order: AddOrderRequest): Promise<ApiResponse<Order>>;
        getOrderById(orderId: number): Promise<ApiResponse<Order>>;
        deleteOrder(orderId: number): Promise<ApiResponse<{}>>;

        createUser(user: User): Promise<ApiResponse<User>>;
        getUserById(userId: number): Promise<ApiResponse<User>>;
        createOrUpdateUser(userId: number, user: User): Promise<ApiResponse<User>>;
        deleteUser(userId: number): Promise<ApiResponse<{}>>;
    }
}

export = PetStore;